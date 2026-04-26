using Microsoft.AspNetCore.Authorization;
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
[Route("api/[controller]")]
[Authorize(Policy = AuthConstants.Policies.UserOnly)]
public class ForumPostsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;
    private static readonly string[] AllowedSorts = ["newest", "oldest", "mostliked", "mostbookmarked", "mostrelevant"];

    public ForumPostsController(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        var me = TryGetCurrentUserId();
        var postsQuery = ApplyBlockedUsersFilter(_db.ForumPosts, me);
        var posts = await postsQuery
            .Include(p => p.User)
            .Include(p => p.Attachments)
            .Include(p => p.Replies)
            .Include(p => p.Bookmarks)
            .Include(p => p.Likes)
            .Where(p => !p.IsAReply)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return Ok(posts.Select(p => ToResponse(p, me)));
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(Guid id)
    {
        var me = TryGetCurrentUserId();
        var post = await ApplyBlockedUsersFilter(_db.ForumPosts, me)
            .Include(p => p.User)
            .Include(p => p.Attachments)
            .Include(p => p.Replies)
            .Include(p => p.Bookmarks)
            .Include(p => p.Likes)
            .FirstOrDefaultAsync(p => p.Id == id);

        return post is null ? NotFound() : Ok(ToResponse(post, me));
    }

    [HttpGet("{id:guid}/replies")]
    [AllowAnonymous]
    public async Task<IActionResult> GetReplies(Guid id)
    {
        var me = TryGetCurrentUserId();
        var replies = await ApplyBlockedUsersFilter(_db.ForumPosts, me)
            .Include(p => p.User)
            .Include(p => p.Attachments)
            .Include(p => p.Bookmarks)
            .Include(p => p.Likes)
            .Where(p => p.ReplyingToPostId == id)
            .OrderBy(p => p.CreatedAt)
            .ToListAsync();

        return Ok(replies.Select(r => ToResponse(r, me)));
    }

    [HttpGet("search")]
    [AllowAnonymous]
    public async Task<IActionResult> Search(
        [FromQuery] string? q,
        [FromQuery] bool? mine,
        [FromQuery] bool? likedByMe,
        [FromQuery] bool? bookmarkedByMe,
        [FromQuery] bool? isReply,
        [FromQuery] bool? hasAttachments,
        [FromQuery] long? userId,
        [FromQuery] string? sort = "newest",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var me = TryGetCurrentUserId();
        if (!TryValidateSearchRequest(sort, page, pageSize, mine, likedByMe, bookmarkedByMe, me, out var error))
        {
            return error!;
        }

        var query = BuildForumPostQuery(ApplyBlockedUsersFilter(_db.ForumPosts.AsNoTracking(), me), q, mine, likedByMe, bookmarkedByMe, isReply, hasAttachments, userId, me);
        query = ApplySorting(query, NormalizeSort(sort));

        return Ok(await ToPagedResponseAsync(query, me, page, pageSize));
    }

    [HttpGet("{id:guid}/replies/search")]
    [AllowAnonymous]
    public async Task<IActionResult> SearchReplies(
        Guid id,
        [FromQuery] string? q,
        [FromQuery] bool? mine,
        [FromQuery] bool? likedByMe,
        [FromQuery] bool? bookmarkedByMe,
        [FromQuery] bool? hasAttachments,
        [FromQuery] long? userId,
        [FromQuery] string? sort = "oldest",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var me = TryGetCurrentUserId();
        if (!TryValidateSearchRequest(sort, page, pageSize, mine, likedByMe, bookmarkedByMe, me, out var error))
        {
            return error!;
        }

        var parentExists = await _db.ForumPosts.AsNoTracking().AnyAsync(p => p.Id == id);
        if (!parentExists)
        {
            return NotFound(new { message = "Parent post not found." });
        }

        var query = BuildForumPostQuery(
            ApplyBlockedUsersFilter(_db.ForumPosts.AsNoTracking(), me).Where(p => p.ReplyingToPostId == id),
            q,
            mine,
            likedByMe,
            bookmarkedByMe,
            true,
            hasAttachments,
            userId,
            me);

        query = ApplySorting(query, NormalizeSort(sort));
        return Ok(await ToPagedResponseAsync(query, me, page, pageSize));
    }

    [HttpGet("liked")]
    public async Task<IActionResult> GetLikedPosts()
    {
        var me = User.GetUserId();
        var likes = await _db.ForumPostLikes
            .Where(l => l.UserId == me)
            .Where(l => !_db.UserBlocks.Any(b => b.BlockerUserId == me && b.BlockedUserId == l.ForumPost.UserId))
            .OrderByDescending(l => l.CreatedAt)
            .Include(l => l.ForumPost)
                .ThenInclude(p => p.User)
            .Include(l => l.ForumPost)
                .ThenInclude(p => p.Attachments)
            .Include(l => l.ForumPost)
                .ThenInclude(p => p.Replies)
            .Include(l => l.ForumPost)
                .ThenInclude(p => p.Bookmarks)
            .Include(l => l.ForumPost)
                .ThenInclude(p => p.Likes)
            .ToListAsync();

        return Ok(likes.Select(l => ToResponse(l.ForumPost, me)));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateForumPostRequest request)
    {
        var me = User.GetUserId();
        if (!TryCreateLegacyAttachments(request.Attachments, out var attachments, out var errorResult))
        {
            return errorResult!;
        }

        var post = new ForumPostModel
        {
            Id = Guid.NewGuid(),
            UserId = me,
            Content = request.Content.Trim(),
            IsAReply = false,
            CreatedAt = DateTimeOffset.UtcNow,
            Attachments = attachments
        };

        _db.ForumPosts.Add(post);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = post.Id }, new { post.Id });
    }

    [HttpPost("{id:guid}/reply")]
    public async Task<IActionResult> Reply(Guid id, [FromBody] ReplyToForumPostRequest request)
    {
        var me = User.GetUserId();
        var parentExists = await _db.ForumPosts.AnyAsync(p => p.Id == id);
        if (!parentExists) return NotFound(new { message = "Parent post not found." });
        if (!TryCreateLegacyAttachments(request.Attachments, out var attachments, out var errorResult))
        {
            return errorResult!;
        }

        var post = new ForumPostModel
        {
            Id = Guid.NewGuid(),
            UserId = me,
            Content = request.Content.Trim(),
            IsAReply = true,
            ReplyingToPostId = id,
            CreatedAt = DateTimeOffset.UtcNow,
            Attachments = attachments
        };

        _db.ForumPosts.Add(post);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = post.Id }, new { post.Id });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateForumPostRequest request)
    {
        var me = User.GetUserId();
        var post = await _db.ForumPosts.FirstOrDefaultAsync(p => p.Id == id && p.UserId == me);
        if (post is null) return NotFound();

        post.Content = request.Content.Trim();
        post.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Post updated." });
    }

    [HttpPost("{id:guid}/attachments")]
    [Consumes("multipart/form-data")]
    [EnableRateLimiting("uploads")]
    [RequestSizeLimit(ForumMediaUploadRules.MaxUploadRequestBytes)]
    public async Task<IActionResult> UploadAttachments(Guid id, [FromForm] UploadForumMediaFilesRequest request)
    {
        var me = User.GetUserId();
        var post = await _db.ForumPosts
            .Include(p => p.Attachments)
            .FirstOrDefaultAsync(p => p.Id == id && p.UserId == me);
        if (post is null)
        {
            return NotFound(new { message = "Post not found." });
        }

        var existingVideoCount = post.Attachments.Count(a => a.MediaType == ForumAttachmentMediaType.Video);
        if (!ForumMediaUploadRules.TryValidate(request.Files, post.Attachments.Count, existingVideoCount, out var errorMessage, out var validatedFiles))
        {
            return BadRequest(new { message = errorMessage });
        }

        var createdAttachments = new List<ForumPostAttachmentModel>(validatedFiles.Count);
        foreach (var validatedFile in validatedFiles)
        {
            var attachmentUrl = await LocalImageStorage.SaveFileAsync(
                _env,
                validatedFile.File,
                "forum",
                validatedFile.NormalizedExtension,
                "forum-posts",
                post.Id.ToString("N"));

            createdAttachments.Add(new ForumPostAttachmentModel
            {
                ForumPostId = post.Id,
                Url = attachmentUrl,
                MediaType = validatedFile.MediaType,
                FileSizeBytes = validatedFile.FileSizeBytes,
                CreatedAt = DateTimeOffset.UtcNow
            });
        }

        _db.ForumPostAttachments.AddRange(createdAttachments);
        await _db.SaveChangesAsync();

        return Ok(createdAttachments
            .OrderBy(a => a.CreatedAt)
            .ThenBy(a => a.Id)
            .Select(ToAttachmentResponse)
            .ToList());
    }

    [HttpDelete("{id:guid}/attachments/{attachmentId:long}")]
    public async Task<IActionResult> DeleteAttachment(Guid id, long attachmentId)
    {
        var me = User.GetUserId();
        var post = await _db.ForumPosts
            .Include(p => p.Attachments)
            .FirstOrDefaultAsync(p => p.Id == id && p.UserId == me);
        if (post is null)
        {
            return NotFound(new { message = "Post not found." });
        }

        var attachment = post.Attachments.FirstOrDefault(a => a.Id == attachmentId);
        if (attachment is null)
        {
            return NotFound(new { message = "Attachment not found." });
        }

        _db.ForumPostAttachments.Remove(attachment);
        LocalImageStorage.TryDeleteFile(_env, attachment.Url);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var me = User.GetUserId();
        var post = await _db.ForumPosts.FirstOrDefaultAsync(p => p.Id == id && p.UserId == me);
        if (post is null) return NotFound();

        await using var tx = await _db.Database.BeginTransactionAsync();
        await DeletePostThreadAsync(post.Id);
        await tx.CommitAsync();

        return NoContent();
    }

    private async Task DeletePostThreadAsync(Guid rootPostId)
    {
        var levels = new List<List<Guid>>();
        var seenIds = new HashSet<Guid>();
        var currentLevel = new List<Guid> { rootPostId };

        while (currentLevel.Count > 0)
        {
            levels.Add(currentLevel);
            foreach (var postId in currentLevel)
            {
                seenIds.Add(postId);
            }

            var nextLevel = await _db.ForumPosts
                .AsNoTracking()
                .Where(p => p.ReplyingToPostId.HasValue && currentLevel.Contains(p.ReplyingToPostId.Value))
                .Select(p => p.Id)
                .ToListAsync();

            currentLevel = nextLevel
                .Where(postId => !seenIds.Contains(postId))
                .Distinct()
                .ToList();
        }

        var allPostIds = levels.SelectMany(level => level).ToList();
        var attachmentUrls = await _db.ForumPostAttachments
            .AsNoTracking()
            .Where(a => allPostIds.Contains(a.ForumPostId))
            .Select(a => a.Url)
            .ToListAsync();

        foreach (var attachmentUrl in attachmentUrls)
        {
            LocalImageStorage.TryDeleteFile(_env, attachmentUrl);
        }

        for (var index = levels.Count - 1; index >= 0; index--)
        {
            var levelIds = levels[index];
            await _db.ForumPosts
                .Where(p => levelIds.Contains(p.Id))
                .ExecuteDeleteAsync();
        }
    }

    [HttpPost("{id:guid}/like")]
    public async Task<IActionResult> Like(Guid id)
    {
        var me = User.GetUserId();
        var post = await _db.ForumPosts
            .Include(p => p.Likes)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (post is null) return NotFound(new { message = "Post not found." });

        var alreadyLiked = post.Likes.Any(l => l.UserId == me);
        if (!alreadyLiked)
        {
            post.Likes.Add(new ForumPostLikeModel
            {
                UserId = me,
                ForumPostId = id,
                CreatedAt = DateTimeOffset.UtcNow
            });

            await _db.SaveChangesAsync();
        }

        return Ok(new ForumPostLikeStatusResponse(
            id,
            post.Likes.Count,
            true
        ));
    }

    [HttpDelete("{id:guid}/like")]
    public async Task<IActionResult> Unlike(Guid id)
    {
        var me = User.GetUserId();
        var like = await _db.ForumPostLikes.FirstOrDefaultAsync(l => l.UserId == me && l.ForumPostId == id);
        if (like is null) return NotFound(new { message = "Like not found." });

        _db.ForumPostLikes.Remove(like);
        await _db.SaveChangesAsync();

        var likesCount = await _db.ForumPostLikes.CountAsync(l => l.ForumPostId == id);
        return Ok(new ForumPostLikeStatusResponse(
            id,
            likesCount,
            false
        ));
    }

    private long? TryGetCurrentUserId()
    {
        if (!User.Identity?.IsAuthenticated ?? true) return null;
        return User.GetUserId();
    }

    private ForumPostResponse ToResponse(ForumPostModel post, long? currentUserId)
    {
        var isBookmarkedByCurrentUser = currentUserId.HasValue && post.Bookmarks.Any(b => b.UserId == currentUserId.Value);

        return new ForumPostResponse(
            post.Id,
            post.UserId,
            GetDisplayName(post.User),
            ToVersionedStaticFileUrl(post.User.AvatarUrl),
            post.Content,
            post.Attachments
                .OrderBy(a => a.CreatedAt)
                .ThenBy(a => a.Id)
                .Select(ToAttachmentResponse)
                .ToList(),
            post.CreatedAt,
            post.UpdatedAt,
            post.IsAReply,
            post.ReplyingToPostId,
            post.Replies.Count,
            isBookmarkedByCurrentUser,
            isBookmarkedByCurrentUser,
            post.Bookmarks.Count,
            post.Likes.Count,
            currentUserId.HasValue && post.Likes.Any(l => l.UserId == currentUserId.Value)
        );
    }

    private static bool TryValidateSearchRequest(
        string? sort,
        int page,
        int pageSize,
        bool? mine,
        bool? likedByMe,
        bool? bookmarkedByMe,
        long? currentUserId,
        out IActionResult? error)
    {
        if (page < 1)
        {
            error = new BadRequestObjectResult(new { message = "page must be greater than or equal to 1." });
            return false;
        }

        if (pageSize < 1 || pageSize > 100)
        {
            error = new BadRequestObjectResult(new { message = "pageSize must be between 1 and 100." });
            return false;
        }

        var normalizedSort = NormalizeSort(sort);
        if (!AllowedSorts.Contains(normalizedSort))
        {
            error = new BadRequestObjectResult(new { message = "sort must be one of: newest, oldest, mostLiked, mostBookmarked, mostRelevant." });
            return false;
        }

        if ((mine.HasValue || likedByMe.HasValue || bookmarkedByMe.HasValue) && !currentUserId.HasValue)
        {
            error = new UnauthorizedObjectResult(new { message = "Authentication is required for mine, likedByMe, and bookmarkedByMe filters." });
            return false;
        }

        error = null;
        return true;
    }

    private static string NormalizeSort(string? sort) =>
        string.IsNullOrWhiteSpace(sort) ? "newest" : sort.Trim().ToLowerInvariant();

    private IQueryable<ForumPostModel> BuildForumPostQuery(
        IQueryable<ForumPostModel> query,
        string? q,
        bool? mine,
        bool? likedByMe,
        bool? bookmarkedByMe,
        bool? isReply,
        bool? hasAttachments,
        long? userId,
        long? currentUserId)
    {
        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = $"%{q.Trim()}%";
            query = query.Where(p => EF.Functions.ILike(p.Content, term));
        }

        if (mine.HasValue && currentUserId.HasValue)
        {
            query = query.Where(p => (p.UserId == currentUserId.Value) == mine.Value);
        }

        if (likedByMe.HasValue && currentUserId.HasValue)
        {
            query = query.Where(p => p.Likes.Any(l => l.UserId == currentUserId.Value) == likedByMe.Value);
        }

        if (bookmarkedByMe.HasValue && currentUserId.HasValue)
        {
            query = query.Where(p => p.Bookmarks.Any(b => b.UserId == currentUserId.Value) == bookmarkedByMe.Value);
        }

        if (isReply.HasValue)
        {
            query = query.Where(p => p.IsAReply == isReply.Value);
        }

        if (hasAttachments.HasValue)
        {
            query = query.Where(p => p.Attachments.Any() == hasAttachments.Value);
        }

        if (userId.HasValue)
        {
            query = query.Where(p => p.UserId == userId.Value);
        }

        return query;
    }

    private IQueryable<ForumPostModel> ApplyBlockedUsersFilter(IQueryable<ForumPostModel> query, long? currentUserId)
    {
        if (!currentUserId.HasValue)
        {
            return query;
        }

        var invisibleUserIds = _db.UserBlocks
            .AsNoTracking()
            .Where(b =>
                b.BlockerUserId == currentUserId.Value ||
                b.BlockedUserId == currentUserId.Value)
            .Select(b => b.BlockerUserId == currentUserId.Value
                ? b.BlockedUserId
                : b.BlockerUserId);

        return query.Where(p => !invisibleUserIds.Contains(p.UserId));
    }

    private static IQueryable<ForumPostModel> ApplySorting(IQueryable<ForumPostModel> query, string sort)
    {
        var relevantSince = DateTimeOffset.UtcNow.AddDays(-7);

        return sort switch
        {
            "oldest" => query
                .OrderBy(p => p.CreatedAt)
                .ThenBy(p => p.Id),
            "mostliked" => query
                .OrderByDescending(p => p.Likes.Count())
                .ThenByDescending(p => p.CreatedAt)
                .ThenByDescending(p => p.Id),
            "mostbookmarked" => query
                .OrderByDescending(p => p.Bookmarks.Count())
                .ThenByDescending(p => p.CreatedAt)
                .ThenByDescending(p => p.Id),
            "mostrelevant" => query
                .OrderByDescending(p => p.Likes.Count(l => l.CreatedAt >= relevantSince))
                .ThenByDescending(p => p.CreatedAt)
                .ThenByDescending(p => p.Id),
            _ => query
                .OrderByDescending(p => p.CreatedAt)
                .ThenByDescending(p => p.Id)
        };
    }

    private async Task<ForumPostListResponse> ToPagedResponseAsync(IQueryable<ForumPostModel> query, long? currentUserId, int page, int pageSize)
    {
        var totalCount = await query.CountAsync();
        var rows = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new ForumPostQueryItem(
                p.Id,
                p.UserId,
                p.User.Username,
                p.User.FirstName,
                p.User.LastName,
                p.User.AvatarUrl,
                p.Content,
                p.Attachments
                    .OrderBy(a => a.CreatedAt)
                    .ThenBy(a => a.Id)
                    .Select(a => new ForumPostAttachmentResponse(
                        a.Id,
                        a.Url,
                        a.MediaType,
                        a.FileSizeBytes,
                        a.CreatedAt
                    ))
                    .ToList(),
                p.CreatedAt,
                p.UpdatedAt,
                p.IsAReply,
                p.ReplyingToPostId,
                p.Replies.Count,
                p.Bookmarks.Count,
                currentUserId.HasValue && p.Bookmarks.Any(b => b.UserId == currentUserId.Value),
                p.Likes.Count,
                currentUserId.HasValue && p.Likes.Any(l => l.UserId == currentUserId.Value)
            ))
            .ToListAsync();

        var items = rows
            .Select(r => CreateForumPostResponse(
                r.Id,
                r.UserId,
                GetDisplayName(r.UserName, r.FirstName, r.LastName),
                r.UserImage,
                r.Content,
                r.Attachments,
                r.CreatedAt,
                r.UpdatedAt,
                r.IsAReply,
                r.ReplyingToPost,
                r.RepliesCount,
                r.IsBookmarkedByCurrentUser,
                r.BookmarksCount,
                r.LikesCount,
                r.IsLikedByCurrentUser
            ))
            .ToList();

        var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);
        return new ForumPostListResponse(items, page, pageSize, totalCount, totalPages);
    }

    private static string GetDisplayName(AppUser user)
    {
        var fullName = $"{user.FirstName} {user.LastName}".Trim();
        return string.IsNullOrWhiteSpace(fullName) ? user.Username : fullName;
    }

    private static string GetDisplayName(string username, string firstName, string lastName)
    {
        var fullName = $"{firstName} {lastName}".Trim();
        return string.IsNullOrWhiteSpace(fullName) ? username : fullName;
    }

    private ForumPostResponse CreateForumPostResponse(
        Guid id,
        long userId,
        string userName,
        string? userImage,
        string content,
        IReadOnlyList<ForumPostAttachmentResponse> attachments,
        DateTimeOffset createdAt,
        DateTimeOffset? updatedAt,
        bool isAReply,
        Guid? replyingToPost,
        int repliesCount,
        bool isBookmarkedByCurrentUser,
        int bookmarksCount,
        int likesCount,
        bool isLikedByCurrentUser)
    {
        return new ForumPostResponse(
            id,
            userId,
            userName,
            ToVersionedStaticFileUrl(userImage),
            content,
            attachments,
            createdAt,
            updatedAt,
            isAReply,
            replyingToPost,
            repliesCount,
            isBookmarkedByCurrentUser,
            isBookmarkedByCurrentUser,
            bookmarksCount,
            likesCount,
            isLikedByCurrentUser
        );
    }

    private sealed record ForumPostQueryItem(
        Guid Id,
        long UserId,
        string UserName,
        string FirstName,
        string LastName,
        string? UserImage,
        string Content,
        List<ForumPostAttachmentResponse> Attachments,
        DateTimeOffset CreatedAt,
        DateTimeOffset? UpdatedAt,
        bool IsAReply,
        Guid? ReplyingToPost,
        int RepliesCount,
        int BookmarksCount,
        bool IsBookmarkedByCurrentUser,
        int LikesCount,
        bool IsLikedByCurrentUser
    );

    private static ForumPostAttachmentResponse ToAttachmentResponse(ForumPostAttachmentModel attachment) =>
        new(
            attachment.Id,
            attachment.Url,
            attachment.MediaType,
            attachment.FileSizeBytes,
            attachment.CreatedAt
        );

    private static bool TryCreateLegacyAttachments(
        IReadOnlyCollection<string>? rawAttachments,
        out List<ForumPostAttachmentModel> attachments,
        out IActionResult? error)
    {
        attachments = new List<ForumPostAttachmentModel>();
        error = null;

        if (rawAttachments is null)
        {
            return true;
        }

        var normalizedAttachments = rawAttachments
            .Where(a => !string.IsNullOrWhiteSpace(a))
            .Select(a => a.Trim())
            .ToList();

        if (normalizedAttachments.Count == 0)
        {
            return true;
        }

        if (normalizedAttachments.Count > ForumMediaUploadRules.MaxAttachmentsPerPost)
        {
            error = new BadRequestObjectResult(new
            {
                message = $"A maximum of {ForumMediaUploadRules.MaxAttachmentsPerPost} attachments is allowed per post."
            });
            return false;
        }

        var inferredVideoCount = normalizedAttachments.Count(url => ForumMediaUploadRules.InferMediaTypeFromUrl(url) == ForumAttachmentMediaType.Video);
        if (inferredVideoCount > ForumMediaUploadRules.MaxVideosPerPost)
        {
            error = new BadRequestObjectResult(new
            {
                message = $"A maximum of {ForumMediaUploadRules.MaxVideosPerPost} video attachment is allowed per post."
            });
            return false;
        }

        attachments = normalizedAttachments
            .Select(url => new ForumPostAttachmentModel
            {
                Url = url,
                MediaType = ForumMediaUploadRules.InferMediaTypeFromUrl(url),
                FileSizeBytes = 0,
                CreatedAt = DateTimeOffset.UtcNow
            })
            .ToList();

        return true;
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
}
