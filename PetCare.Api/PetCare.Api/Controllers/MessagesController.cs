using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using PetCare.Api.Data;
using PetCare.Api.DTOs;
using PetCare.Api.Model;
using PetCare.Api.Security;
using PetCare.Api.Services;

namespace PetCare.Api.Controllers;

[ApiController]
[Route("api/messages")]
[Authorize(Policy = AuthConstants.Policies.UserOnly)]
public class MessagesController : ControllerBase
{
    private const int MaxMessageContentLength = 5000;

    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;

    public MessagesController(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    [HttpGet("conversations")]
    public async Task<IActionResult> GetConversations(CancellationToken cancellationToken)
    {
        var me = User.GetUserId();
        var rows = await LoadConversationSummaryRowsAsync(me, conversationId: null, cancellationToken);
        var summaries = await BuildConversationSummaryResponsesAsync(rows, me, cancellationToken);

        return Ok(summaries);
    }

    [HttpGet("conversations/{id:long}")]
    public async Task<IActionResult> GetConversation(long id, CancellationToken cancellationToken)
    {
        var me = User.GetUserId();
        var header = await GetConversationDetailHeaderAsync(id, me, cancellationToken);

        if (header is null)
        {
            return NotFound(new { message = "Conversation not found." });
        }

        var messageRows = await _db.DirectMessages
            .AsNoTracking()
            .Where(m => m.ConversationId == id)
            .OrderBy(m => m.CreatedAt)
            .ThenBy(m => m.Id)
            .Select(m => new DirectMessageQueryItem(
                m.Id,
                m.ConversationId,
                m.SenderUserId,
                m.Content,
                m.MediaUrl,
                m.MediaType,
                m.MediaSizeBytes,
                m.CreatedAt
            ))
            .ToListAsync(cancellationToken);
        var messages = messageRows.Select(ToDirectMessageResponse).ToList();

        return Ok(new ConversationDetailResponse(
            header.Id,
            ToUserResponse(
                header.OtherUserId,
                header.OtherUsername,
                header.OtherFirstName,
                header.OtherLastName,
                header.OtherAvatarUrl,
                header.OtherIsApprovedPlaceOwner),
            header.CreatedAt,
            header.LastMessageAt,
            header.LastReadAt,
            messages
        ));
    }

    [HttpPost("conversations/{otherUserId:long}")]
    public async Task<IActionResult> CreateConversation(long otherUserId, CancellationToken cancellationToken)
    {
        var me = User.GetUserId();
        if (otherUserId == me)
        {
            return BadRequest(new { message = "You cannot create a conversation with yourself." });
        }

        var otherUserExists = await _db.Users
            .AsNoTracking()
            .AnyAsync(u => u.Id == otherUserId, cancellationToken);
        if (!otherUserExists)
        {
            return NotFound(new { message = "User not found." });
        }

        if (await HasBlockingRelationshipAsync(me, otherUserId, cancellationToken))
        {
            return DirectMessagingBlocked();
        }

        var (participantOneUserId, participantTwoUserId) = NormalizePair(me, otherUserId);
        var existingConversationId = await FindConversationIdAsync(participantOneUserId, participantTwoUserId, cancellationToken);
        if (existingConversationId.HasValue)
        {
            var existingSummary = await GetConversationSummaryAsync(existingConversationId.Value, me, cancellationToken);
            return Ok(existingSummary);
        }

        var conversation = new ConversationModel
        {
            ParticipantOneUserId = participantOneUserId,
            ParticipantTwoUserId = participantTwoUserId,
            CreatedAt = DateTimeOffset.UtcNow,
            Participants =
            {
                new ConversationParticipantModel { UserId = participantOneUserId },
                new ConversationParticipantModel { UserId = participantTwoUserId }
            }
        };

        _db.Conversations.Add(conversation);

        try
        {
            await _db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            existingConversationId = await FindConversationIdAsync(participantOneUserId, participantTwoUserId, cancellationToken);
            if (existingConversationId.HasValue)
            {
                var existingSummary = await GetConversationSummaryAsync(existingConversationId.Value, me, cancellationToken);
                return Ok(existingSummary);
            }

            throw;
        }

        var summary = await GetConversationSummaryAsync(conversation.Id, me, cancellationToken);
        return CreatedAtAction(nameof(GetConversation), new { id = conversation.Id }, summary);
    }

    [HttpPost("conversations/{id:long}/messages")]
    [Consumes("application/json")]
    public async Task<IActionResult> SendMessage(
        long id,
        [FromBody] SendDirectMessageRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryNormalizeMessageContent(request.Content, requireContent: true, out var content, out var validationError))
        {
            return validationError!;
        }

        return await SendMessageCoreAsync(id, content, mediaFile: null, cancellationToken);
    }

    [HttpPost("conversations/{id:long}/messages")]
    [Consumes("multipart/form-data")]
    [EnableRateLimiting("uploads")]
    [RequestSizeLimit(DirectMessageMediaUploadRules.MaxUploadRequestBytes)]
    public async Task<IActionResult> SendMessageWithMedia(
        long id,
        [FromForm] SendDirectMessageFormRequest request,
        CancellationToken cancellationToken)
    {
        if (Request.Form.Files.Count > DirectMessageMediaUploadRules.MaxMediaFilesPerMessage)
        {
            return BadRequest(new { message = "You can attach at most one media file per message." });
        }

        var uploadedFile = request.File ?? Request.Form.Files.FirstOrDefault();
        if (!DirectMessageMediaUploadRules.TryValidate(uploadedFile, out var mediaError, out var mediaFile))
        {
            return BadRequest(new { message = mediaError });
        }

        if (!TryNormalizeMessageContent(request.Content, requireContent: mediaFile is null, out var content, out var validationError))
        {
            return validationError!;
        }

        return await SendMessageCoreAsync(id, content, mediaFile, cancellationToken);
    }

    private async Task<IActionResult> SendMessageCoreAsync(
        long id,
        string content,
        DirectMessageMediaUploadRules.ValidatedDirectMessageMediaFile? mediaFile,
        CancellationToken cancellationToken)
    {
        var me = User.GetUserId();
        var participant = await _db.ConversationParticipants
            .Include(p => p.Conversation)
            .FirstOrDefaultAsync(p => p.ConversationId == id && p.UserId == me, cancellationToken);

        if (participant is null)
        {
            return NotFound(new { message = "Conversation not found." });
        }

        var otherUserId = participant.Conversation.ParticipantOneUserId == me
            ? participant.Conversation.ParticipantTwoUserId
            : participant.Conversation.ParticipantOneUserId;

        if (await HasBlockingRelationshipAsync(me, otherUserId, cancellationToken))
        {
            return DirectMessagingBlocked();
        }

        var now = DateTimeOffset.UtcNow;
        string? mediaUrl = null;
        if (mediaFile is not null)
        {
            mediaUrl = await LocalImageStorage.SaveFileAsync(
                _env,
                mediaFile.File,
                "dm",
                mediaFile.NormalizedExtension,
                "direct-messages",
                id.ToString());
        }

        var message = new DirectMessageModel
        {
            ConversationId = id,
            SenderUserId = me,
            Content = content,
            MediaUrl = mediaUrl,
            MediaType = mediaFile?.MediaType,
            MediaSizeBytes = mediaFile?.FileSizeBytes,
            CreatedAt = now
        };

        participant.LastReadAt = now;
        participant.Conversation.LastMessageAt = now;
        _db.DirectMessages.Add(message);

        try
        {
            await _db.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            LocalImageStorage.TryDeleteFile(_env, mediaUrl);
            throw;
        }

        return Created(string.Empty, ToDirectMessageResponse(message));
    }

    [HttpPost("conversations/{id:long}/read")]
    public async Task<IActionResult> MarkConversationRead(long id, CancellationToken cancellationToken)
    {
        var me = User.GetUserId();
        var participant = await _db.ConversationParticipants
            .FirstOrDefaultAsync(p => p.ConversationId == id && p.UserId == me, cancellationToken);

        if (participant is null)
        {
            return NotFound(new { message = "Conversation not found." });
        }

        var now = DateTimeOffset.UtcNow;
        participant.LastReadAt = now;
        await _db.SaveChangesAsync(cancellationToken);

        return Ok(new MarkConversationReadResponse(id, now));
    }

    private async Task<List<ConversationSummaryBaseQueryItem>> LoadConversationSummaryRowsAsync(
        long currentUserId,
        long? conversationId,
        CancellationToken cancellationToken)
    {
        var query = _db.ConversationParticipants
            .AsNoTracking()
            .Where(p => p.UserId == currentUserId);

        if (conversationId.HasValue)
        {
            query = query.Where(p => p.ConversationId == conversationId.Value);
        }

        return await query
            .OrderByDescending(p => p.Conversation.LastMessageAt ?? p.Conversation.CreatedAt)
            .ThenByDescending(p => p.ConversationId)
            .Select(p => new ConversationSummaryBaseQueryItem(
                p.Conversation.Id,
                p.Conversation.CreatedAt,
                p.Conversation.LastMessageAt,
                p.LastReadAt,
                p.Conversation.ParticipantOneUserId,
                p.Conversation.ParticipantTwoUserId
            ))
            .ToListAsync(cancellationToken);
    }

    private async Task<ConversationDetailHeaderQueryItem?> GetConversationDetailHeaderAsync(
        long conversationId,
        long currentUserId,
        CancellationToken cancellationToken)
    {
        var row = await _db.ConversationParticipants
            .AsNoTracking()
            .Where(p => p.ConversationId == conversationId && p.UserId == currentUserId)
            .Select(p => new ConversationDetailBaseQueryItem(
                p.Conversation.Id,
                p.Conversation.CreatedAt,
                p.Conversation.LastMessageAt,
                p.LastReadAt,
                p.Conversation.ParticipantOneUserId,
                p.Conversation.ParticipantTwoUserId
            ))
            .FirstOrDefaultAsync(cancellationToken);

        if (row is null)
        {
            return null;
        }

        var otherUserId = GetOtherParticipantUserId(row.ParticipantOneUserId, row.ParticipantTwoUserId, currentUserId);
        var users = await LoadDirectMessageUsersAsync(new[] { otherUserId }, cancellationToken);

        return users.TryGetValue(otherUserId, out var otherUser)
            ? new ConversationDetailHeaderQueryItem(
                row.Id,
                row.CreatedAt,
                row.LastMessageAt,
                row.LastReadAt,
                otherUser.Id,
                otherUser.Username,
                otherUser.FirstName,
                otherUser.LastName,
                otherUser.AvatarUrl,
                otherUser.IsApprovedPlaceOwner)
            : null;
    }

    private async Task<ConversationSummaryResponse?> GetConversationSummaryAsync(
        long conversationId,
        long currentUserId,
        CancellationToken cancellationToken)
    {
        var rows = await LoadConversationSummaryRowsAsync(currentUserId, conversationId, cancellationToken);
        var summaries = await BuildConversationSummaryResponsesAsync(rows, currentUserId, cancellationToken);

        return summaries.FirstOrDefault();
    }

    private async Task<IReadOnlyList<ConversationSummaryResponse>> BuildConversationSummaryResponsesAsync(
        IReadOnlyList<ConversationSummaryBaseQueryItem> rows,
        long currentUserId,
        CancellationToken cancellationToken)
    {
        if (rows.Count == 0)
        {
            return Array.Empty<ConversationSummaryResponse>();
        }

        var otherUserIds = rows
            .Select(row => GetOtherParticipantUserId(row.ParticipantOneUserId, row.ParticipantTwoUserId, currentUserId))
            .Distinct()
            .ToArray();
        var conversationIds = rows.Select(row => row.Id).Distinct().ToArray();

        var users = await LoadDirectMessageUsersAsync(otherUserIds, cancellationToken);
        var messageSnapshots = await LoadConversationMessageSnapshotsAsync(conversationIds, cancellationToken);
        var messagesByConversationId = messageSnapshots
            .GroupBy(m => m.ConversationId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var summaries = new List<ConversationSummaryResponse>(rows.Count);
        foreach (var row in rows)
        {
            var otherUserId = GetOtherParticipantUserId(row.ParticipantOneUserId, row.ParticipantTwoUserId, currentUserId);
            if (!users.TryGetValue(otherUserId, out var otherUser))
            {
                continue;
            }

            messagesByConversationId.TryGetValue(row.Id, out var messages);
            var latestMessageContent = messages?
                .OrderByDescending(m => m.CreatedAt)
                .ThenByDescending(m => m.Id)
                .Select(m => m.Content)
                .FirstOrDefault();
            var unreadCount = messages?.Count(m =>
                m.SenderUserId != currentUserId &&
                (!row.LastReadAt.HasValue || m.CreatedAt > row.LastReadAt.Value)) ?? 0;

            summaries.Add(ToSummaryResponse(new ConversationSummaryQueryItem(
                row.Id,
                row.CreatedAt,
                row.LastMessageAt,
                otherUser.Id,
                otherUser.Username,
                otherUser.FirstName,
                otherUser.LastName,
                otherUser.AvatarUrl,
                otherUser.IsApprovedPlaceOwner,
                latestMessageContent,
                unreadCount
            )));
        }

        return summaries;
    }

    private async Task<Dictionary<long, DirectMessageUserQueryItem>> LoadDirectMessageUsersAsync(
        IReadOnlyCollection<long> userIds,
        CancellationToken cancellationToken)
    {
        if (userIds.Count == 0)
        {
            return new Dictionary<long, DirectMessageUserQueryItem>();
        }

        return await _db.Users
            .AsNoTracking()
            .Where(u => userIds.Contains(u.Id))
            .Select(u => new DirectMessageUserQueryItem(
                u.Id,
                u.Username,
                u.FirstName,
                u.LastName,
                u.AvatarUrl,
                u.IsApprovedPlaceOwner
            ))
            .ToDictionaryAsync(u => u.Id, cancellationToken);
    }

    private async Task<List<ConversationMessageSnapshot>> LoadConversationMessageSnapshotsAsync(
        IReadOnlyCollection<long> conversationIds,
        CancellationToken cancellationToken)
    {
        if (conversationIds.Count == 0)
        {
            return new List<ConversationMessageSnapshot>();
        }

        return await _db.DirectMessages
            .AsNoTracking()
            .Where(m => conversationIds.Contains(m.ConversationId))
            .Select(m => new ConversationMessageSnapshot(
                m.ConversationId,
                m.Id,
                m.SenderUserId,
                m.Content,
                m.CreatedAt
            ))
            .ToListAsync(cancellationToken);
    }

    private async Task<long?> FindConversationIdAsync(
        long participantOneUserId,
        long participantTwoUserId,
        CancellationToken cancellationToken) =>
        await _db.Conversations
            .AsNoTracking()
            .Where(c =>
                c.ParticipantOneUserId == participantOneUserId &&
                c.ParticipantTwoUserId == participantTwoUserId)
            .Select(c => (long?)c.Id)
            .FirstOrDefaultAsync(cancellationToken);

    private async Task<bool> HasBlockingRelationshipAsync(
        long firstUserId,
        long secondUserId,
        CancellationToken cancellationToken) =>
        await _db.UserBlocks
            .AsNoTracking()
            .AnyAsync(b =>
                (b.BlockerUserId == firstUserId && b.BlockedUserId == secondUserId) ||
                (b.BlockerUserId == secondUserId && b.BlockedUserId == firstUserId),
                cancellationToken);

    private IActionResult DirectMessagingBlocked() =>
        StatusCode(
            StatusCodes.Status403Forbidden,
            new { message = "Direct messaging is not allowed because one user has blocked the other." });

    private ConversationSummaryResponse ToSummaryResponse(ConversationSummaryQueryItem row) =>
        new(
            row.Id,
            ToUserResponse(
                row.OtherUserId,
                row.OtherUsername,
                row.OtherFirstName,
                row.OtherLastName,
                row.OtherAvatarUrl,
                row.OtherIsApprovedPlaceOwner),
            ToPreview(row.LastMessageContent),
            row.LastMessageAt,
            row.UnreadCount,
            row.CreatedAt
        );

    private DirectMessageUserResponse ToUserResponse(
        long id,
        string username,
        string firstName,
        string lastName,
        string? avatarUrl,
        bool isApprovedPlaceOwner) =>
        new(
            id,
            username,
            firstName,
            lastName,
            GetDisplayName(username, firstName, lastName),
            ToVersionedStaticFileUrl(avatarUrl),
            isApprovedPlaceOwner
        );

    private DirectMessageResponse ToDirectMessageResponse(DirectMessageModel message) =>
        new(
            message.Id,
            message.ConversationId,
            message.SenderUserId,
            message.Content,
            ToVersionedStaticFileUrl(message.MediaUrl),
            message.MediaType,
            message.MediaSizeBytes,
            message.CreatedAt
        );

    private DirectMessageResponse ToDirectMessageResponse(DirectMessageQueryItem message) =>
        new(
            message.Id,
            message.ConversationId,
            message.SenderUserId,
            message.Content,
            ToVersionedStaticFileUrl(message.MediaUrl),
            message.MediaType,
            message.MediaSizeBytes,
            message.CreatedAt
        );

    private static bool TryNormalizeMessageContent(
        string? rawContent,
        bool requireContent,
        out string content,
        out IActionResult? error)
    {
        content = string.Empty;
        error = null;

        if (string.IsNullOrWhiteSpace(rawContent))
        {
            if (requireContent)
            {
                error = new BadRequestObjectResult(new { message = "Message content is required." });
                return false;
            }

            return true;
        }

        var trimmed = rawContent.Trim();
        if (trimmed.Length > MaxMessageContentLength)
        {
            error = new BadRequestObjectResult(new { message = $"Message content must be {MaxMessageContentLength} characters or fewer." });
            return false;
        }

        content = trimmed;
        return true;
    }

    private static (long ParticipantOneUserId, long ParticipantTwoUserId) NormalizePair(long firstUserId, long secondUserId) =>
        firstUserId < secondUserId
            ? (firstUserId, secondUserId)
            : (secondUserId, firstUserId);

    private static long GetOtherParticipantUserId(long participantOneUserId, long participantTwoUserId, long currentUserId) =>
        participantOneUserId == currentUserId ? participantTwoUserId : participantOneUserId;

    private static string GetDisplayName(string username, string firstName, string lastName)
    {
        var fullName = $"{firstName} {lastName}".Trim();
        return string.IsNullOrWhiteSpace(fullName) ? username : fullName;
    }

    private static string? ToPreview(string? content)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            return null;
        }

        var preview = content.Trim()
            .Replace("\r", " ")
            .Replace("\n", " ");

        while (preview.Contains("  ", StringComparison.Ordinal))
        {
            preview = preview.Replace("  ", " ");
        }

        return preview.Length <= 120 ? preview : $"{preview[..120]}...";
    }

    private string? ToVersionedStaticFileUrl(string? storedPath)
    {
        if (string.IsNullOrWhiteSpace(storedPath))
        {
            return storedPath;
        }

        var basePath = storedPath.Split('?', 2)[0];
        var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var relativeFilePath = basePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
        var fullPath = Path.Combine(webRoot, relativeFilePath);

        if (!System.IO.File.Exists(fullPath))
        {
            return basePath;
        }

        var version = System.IO.File.GetLastWriteTimeUtc(fullPath).Ticks;
        return $"{basePath}?v={version}";
    }

    private sealed record ConversationSummaryQueryItem(
        long Id,
        DateTimeOffset CreatedAt,
        DateTimeOffset? LastMessageAt,
        long OtherUserId,
        string OtherUsername,
        string OtherFirstName,
        string OtherLastName,
        string? OtherAvatarUrl,
        bool OtherIsApprovedPlaceOwner,
        string? LastMessageContent,
        int UnreadCount
    );

    private sealed record ConversationSummaryBaseQueryItem(
        long Id,
        DateTimeOffset CreatedAt,
        DateTimeOffset? LastMessageAt,
        DateTimeOffset? LastReadAt,
        long ParticipantOneUserId,
        long ParticipantTwoUserId
    );

    private sealed record ConversationDetailBaseQueryItem(
        long Id,
        DateTimeOffset CreatedAt,
        DateTimeOffset? LastMessageAt,
        DateTimeOffset? LastReadAt,
        long ParticipantOneUserId,
        long ParticipantTwoUserId
    );

    private sealed record DirectMessageUserQueryItem(
        long Id,
        string Username,
        string FirstName,
        string LastName,
        string? AvatarUrl,
        bool IsApprovedPlaceOwner
    );

    private sealed record ConversationMessageSnapshot(
        long ConversationId,
        long Id,
        long SenderUserId,
        string Content,
        DateTimeOffset CreatedAt
    );

    private sealed record DirectMessageQueryItem(
        long Id,
        long ConversationId,
        long SenderUserId,
        string Content,
        string? MediaUrl,
        DirectMessageMediaType? MediaType,
        long? MediaSizeBytes,
        DateTimeOffset CreatedAt
    );

    private sealed record ConversationDetailHeaderQueryItem(
        long Id,
        DateTimeOffset CreatedAt,
        DateTimeOffset? LastMessageAt,
        DateTimeOffset? LastReadAt,
        long OtherUserId,
        string OtherUsername,
        string OtherFirstName,
        string OtherLastName,
        string? OtherAvatarUrl,
        bool OtherIsApprovedPlaceOwner
    );
}
