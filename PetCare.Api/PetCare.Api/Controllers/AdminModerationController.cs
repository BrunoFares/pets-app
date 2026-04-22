using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetCare.Api.Data;
using PetCare.Api.DTOs;
using PetCare.Api.Model;
using PetCare.Api.Security;
using PetCare.Api.Services;

namespace PetCare.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Policy = AuthConstants.Policies.AdminOnly)]
public class AdminModerationController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AdminAuditLogger _auditLogger;

    public AdminModerationController(AppDbContext db, AdminAuditLogger auditLogger)
    {
        _db = db;
        _auditLogger = auditLogger;
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _db.Users
            .AsNoTracking()
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new ModeratedUserListItemResponse(
                u.Id,
                u.Username,
                u.FirstName,
                u.LastName,
                u.Email,
                u.EmailVerified,
                u.IsBanned,
                u.BannedAt,
                u.CreatedAt,
                u.LastLogin
            ))
            .ToListAsync();

        return Ok(users);
    }

    [HttpGet("users/search")]
    public async Task<IActionResult> SearchUsers(
        [FromQuery] string? username,
        [FromQuery] string? email,
        [FromQuery] string? firstName,
        [FromQuery] string? lastName,
        [FromQuery] bool? isBanned,
        [FromQuery] string? sortBy = "username",
        [FromQuery] string? sortDirection = "desc",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (page < 1)
        {
            return BadRequest(new { message = "page must be greater than or equal to 1." });
        }

        if (pageSize < 1 || pageSize > 200)
        {
            return BadRequest(new { message = "pageSize must be between 1 and 200." });
        }

        var normalizedSortBy = string.IsNullOrWhiteSpace(sortBy) ? "createdAt" : sortBy.Trim().ToLowerInvariant();
        var normalizedSortDirection = string.IsNullOrWhiteSpace(sortDirection) ? "desc" : sortDirection.Trim().ToLowerInvariant();

        if (normalizedSortDirection is not ("asc" or "desc"))
        {
            return BadRequest(new { message = "sortDirection must be 'asc' or 'desc'." });
        }

        if (normalizedSortBy is not ("createdat" or "username" or "lastname" or "email" or "lastlogin"))
        {
            return BadRequest(new { message = "sortBy must be one of: createdAt, username, lastName, email, lastLogin." });
        }

        var query = _db.Users
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(username))
        {
            var term = $"%{username.Trim()}%";
            query = query.Where(u => EF.Functions.ILike(u.Username, term));
        }

        if (!string.IsNullOrWhiteSpace(email))
        {
            var term = $"%{email.Trim()}%";
            query = query.Where(u => EF.Functions.ILike(u.Email, term));
        }

        if (!string.IsNullOrWhiteSpace(firstName))
        {
            var term = $"%{firstName.Trim()}%";
            query = query.Where(u => EF.Functions.ILike(u.FirstName, term));
        }

        if (!string.IsNullOrWhiteSpace(lastName))
        {
            var term = $"%{lastName.Trim()}%";
            query = query.Where(u => EF.Functions.ILike(u.LastName, term));
        }

        if (isBanned.HasValue)
        {
            query = query.Where(u => u.IsBanned == isBanned.Value);
        }

        query = (normalizedSortBy, normalizedSortDirection) switch
        {
            ("username", "asc") => query.OrderBy(u => u.Username).ThenBy(u => u.Id),
            ("username", "desc") => query.OrderByDescending(u => u.Username).ThenByDescending(u => u.Id),
            ("lastname", "asc") => query.OrderBy(u => u.LastName).ThenBy(u => u.FirstName).ThenBy(u => u.Id),
            ("lastname", "desc") => query.OrderByDescending(u => u.LastName).ThenByDescending(u => u.FirstName).ThenByDescending(u => u.Id),
            ("email", "asc") => query.OrderBy(u => u.Email).ThenBy(u => u.Id),
            ("email", "desc") => query.OrderByDescending(u => u.Email).ThenByDescending(u => u.Id),
            ("lastlogin", "asc") => query.OrderBy(u => u.LastLogin).ThenBy(u => u.Id),
            ("lastlogin", "desc") => query.OrderByDescending(u => u.LastLogin).ThenByDescending(u => u.Id),
            ("createdat", "asc") => query.OrderBy(u => u.CreatedAt).ThenBy(u => u.Id),
            _ => query.OrderByDescending(u => u.CreatedAt).ThenByDescending(u => u.Id)
        };

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new ModeratedUserListItemResponse(
                u.Id,
                u.Username,
                u.FirstName,
                u.LastName,
                u.Email,
                u.EmailVerified,
                u.IsBanned,
                u.BannedAt,
                u.CreatedAt,
                u.LastLogin
            ))
            .ToListAsync();

        var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);
        return Ok(new AdminUserSearchListResponse(items, page, pageSize, totalCount, totalPages));
    }

    [HttpGet("users/{id:long}")]
    public async Task<IActionResult> GetUserById(long id)
    {
        var user = await _db.Users
            .AsNoTracking()
            .Where(u => u.Id == id)
            .Select(u => new ModeratedUserDetailsResponse(
                u.Id,
                u.Username,
                u.FirstName,
                u.LastName,
                u.Email,
                u.AvatarUrl,
                u.Description,
                u.EmailVerified,
                u.IsBanned,
                u.BannedAt,
                u.BanReason,
                u.CreatedAt,
                u.LastLogin
            ))
            .FirstOrDefaultAsync();

        return user is null ? NotFound() : Ok(user);
    }

    [HttpPost("users/{id:long}/ban")]
    public async Task<IActionResult> BanUser(long id, [FromBody] BanUserRequest request)
    {
        var adminUserId = User.GetAdminId();
        var user = await _db.Users.FindAsync(id);
        if (user is null)
        {
            return NotFound();
        }

        user.IsBanned = true;
        user.BannedAt = DateTimeOffset.UtcNow;
        user.BanReason = string.IsNullOrWhiteSpace(request.Reason) ? null : request.Reason.Trim();
        _auditLogger.Log(
            adminUserId,
            "BanUser",
            "User",
            user.Id.ToString(),
            $"Banned user '{user.Username}'.",
            user.BanReason
        );
        await _db.SaveChangesAsync();

        return Ok(new { message = "User banned." });
    }

    [HttpPost("users/{id:long}/unban")]
    public async Task<IActionResult> UnbanUser(long id)
    {
        var adminUserId = User.GetAdminId();
        var user = await _db.Users.FindAsync(id);
        if (user is null)
        {
            return NotFound();
        }

        user.IsBanned = false;
        user.BannedAt = null;
        user.BanReason = null;
        _auditLogger.Log(
            adminUserId,
            "UnbanUser",
            "User",
            user.Id.ToString(),
            $"Unbanned user '{user.Username}'."
        );
        await _db.SaveChangesAsync();

        return Ok(new { message = "User unbanned." });
    }

    [HttpPost("users/{id:long}/revoke-place-owner")]
    public async Task<IActionResult> RevokePlaceOwnerApproval(long id, [FromBody] RevokePlaceOwnerApprovalRequest request)
    {
        var adminUserId = User.GetAdminId();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user is null)
        {
            return NotFound();
        }

        if (!user.IsApprovedPlaceOwner)
        {
            return Conflict(new { message = "User is not currently an approved place owner." });
        }

        user.IsApprovedPlaceOwner = false;

        var ownedPlaces = await _db.PetPlaces
            .Where(p => p.OwnerUserId == user.Id)
            .ToListAsync();

        var deactivatedPlacesCount = 0;
        foreach (var place in ownedPlaces)
        {
            if (place.Status == PlaceStatus.Inactive)
            {
                continue;
            }

            place.Status = PlaceStatus.Inactive;
            deactivatedPlacesCount++;
        }

        var normalizedReason = NormalizeOptionalText(request.Reason);
        var normalizedAdminNotes = NormalizeOptionalText(request.AdminNotes);
        var notesSuffix = string.IsNullOrWhiteSpace(normalizedAdminNotes)
            ? string.Empty
            : $" Notes: {normalizedAdminNotes}";

        _auditLogger.Log(
            adminUserId,
            "RevokePlaceOwnerApproval",
            "User",
            user.Id.ToString(),
            $"Revoked place owner approval for user '{user.Username}' and deactivated {deactivatedPlacesCount} owned place(s).{notesSuffix}",
            normalizedReason
        );

        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "Place owner approval revoked.",
            deactivatedPlacesCount
        });
    }

    [HttpDelete("forum-posts/{id:guid}")]
    public async Task<IActionResult> DeleteForumPost(Guid id)
    {
        var adminUserId = User.GetAdminId();
        var post = await _db.ForumPosts.FirstOrDefaultAsync(p => p.Id == id);
        if (post is null)
        {
            return NotFound();
        }

        _db.ForumPosts.Remove(post);
        _auditLogger.Log(
            adminUserId,
            "DeleteForumPost",
            "ForumPost",
            post.Id.ToString(),
            $"Deleted forum post '{post.Id}' created by user '{post.UserId}'."
        );
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("place-reviews/{id:guid}")]
    public async Task<IActionResult> DeletePlaceReview(Guid id)
    {
        var adminUserId = User.GetAdminId();
        var review = await _db.PetPlaceReviews.FirstOrDefaultAsync(r => r.Id == id);
        if (review is null)
        {
            return NotFound();
        }

        _db.PetPlaceReviews.Remove(review);
        _auditLogger.Log(
            adminUserId,
            "DeletePlaceReview",
            "PlaceReview",
            review.Id.ToString(),
            $"Deleted place review '{review.Id}' for place '{review.PlaceId}' created by user '{review.UserId}'."
        );
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("forum-posts")]
    public async Task<IActionResult> SearchForumPosts(
        [FromQuery] string? content,
        [FromQuery] string? authorUsername,
        [FromQuery] DateTimeOffset? from,
        [FromQuery] DateTimeOffset? to,
        [FromQuery] bool? isReply,
        [FromQuery] string? sortBy = "createdAt",
        [FromQuery] string? sortDirection = "desc",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (page < 1)
        {
            return BadRequest(new { message = "page must be greater than or equal to 1." });
        }

        if (pageSize < 1 || pageSize > 200)
        {
            return BadRequest(new { message = "pageSize must be between 1 and 200." });
        }

        var normalizedSortBy = string.IsNullOrWhiteSpace(sortBy) ? "createdAt" : sortBy.Trim().ToLowerInvariant();
        var normalizedSortDirection = string.IsNullOrWhiteSpace(sortDirection) ? "desc" : sortDirection.Trim().ToLowerInvariant();

        if (normalizedSortDirection is not ("asc" or "desc"))
        {
            return BadRequest(new { message = "sortDirection must be 'asc' or 'desc'." });
        }

        if (normalizedSortBy is not ("createdat" or "updatedat" or "authorusername"))
        {
            return BadRequest(new { message = "sortBy must be one of: createdAt, updatedAt, authorUsername." });
        }

        if (from.HasValue && to.HasValue && from.Value > to.Value)
        {
            return BadRequest(new { message = "from must be earlier than or equal to to." });
        }

        var query = _db.ForumPosts
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(content))
        {
            var term = $"%{content.Trim()}%";
            query = query.Where(p => EF.Functions.ILike(p.Content, term));
        }

        if (!string.IsNullOrWhiteSpace(authorUsername))
        {
            var term = $"%{authorUsername.Trim()}%";
            query = query.Where(p => EF.Functions.ILike(p.User.Username, term));
        }

        if (from.HasValue)
        {
            query = query.Where(p => p.CreatedAt >= from.Value);
        }

        if (to.HasValue)
        {
            query = query.Where(p => p.CreatedAt <= to.Value);
        }

        if (isReply.HasValue)
        {
            query = query.Where(p => p.IsAReply == isReply.Value);
        }

        query = (normalizedSortBy, normalizedSortDirection) switch
        {
            ("authorusername", "asc") => query.OrderBy(p => p.User.Username).ThenBy(p => p.Id),
            ("authorusername", "desc") => query.OrderByDescending(p => p.User.Username).ThenByDescending(p => p.Id),
            ("updatedat", "asc") => query.OrderBy(p => p.UpdatedAt).ThenBy(p => p.Id),
            ("updatedat", "desc") => query.OrderByDescending(p => p.UpdatedAt).ThenByDescending(p => p.Id),
            ("createdat", "asc") => query.OrderBy(p => p.CreatedAt).ThenBy(p => p.Id),
            _ => query.OrderByDescending(p => p.CreatedAt).ThenByDescending(p => p.Id)
        };

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new AdminForumPostListItemResponse(
                p.Id,
                p.UserId,
                p.User.Username,
                p.User.AvatarUrl,
                p.Content,
                p.Attachments.OrderBy(a => a.Id).Select(a => a.Url).ToList(),
                p.CreatedAt,
                p.UpdatedAt,
                p.IsAReply,
                p.ReplyingToPostId,
                p.Replies.Count,
                p.Likes.Count
            ))
            .ToListAsync();

        var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);
        return Ok(new AdminForumPostSearchListResponse(items, page, pageSize, totalCount, totalPages));
    }

    private static string? NormalizeOptionalText(string? value)
    {
        if (value is null)
        {
            return null;
        }

        var trimmed = value.Trim();
        return trimmed.Length == 0 ? null : trimmed;
    }
}
