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
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;

    public UsersController(AppDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var user = await _context.Users.FindAsync(User.GetUserId());
        if (user is null) return NotFound();

        return Ok(new UserProfileResponse(
            user.Id,
            user.Username,
            user.FirstName,
            user.LastName,
            user.Email,
            ToVersionedStaticFileUrl(user.AvatarUrl),
            user.Description,
            user.IsApprovedPlaceOwner,
            user.CreatedAt,
            user.LastLogin
        ));
    }

    [HttpGet("{id:long}/forum-profile")]
    [AllowAnonymous]
    public async Task<IActionResult> GetForumProfile(long id)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id);

        return user is null
            ? NotFound()
            : Ok(new ForumUserProfileResponse(
                user.Id,
                GetDisplayName(user),
                ToVersionedStaticFileUrl(user.AvatarUrl),
                user.Description
            ));
    }

    [HttpPut("edit-profile")]
    public async Task<IActionResult> EditProfile([FromBody] UpdateProfileRequest request)
    {
        var user = await _context.Users.FindAsync(User.GetUserId());
        if (user == null) return NotFound();

        if (!string.IsNullOrWhiteSpace(request.Username))
        {
            var username = request.Username.Trim();
            var usernameTaken = await _context.Users.AnyAsync(u => u.Id != user.Id && u.Username == username);
            if (usernameTaken) return Conflict(new { message = "Username already exists." });
            user.Username = username;
        }

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var email = request.Email.Trim().ToLowerInvariant();
            var emailTaken = await _context.Users.AnyAsync(u => u.Id != user.Id && u.Email == email);
            if (emailTaken) return Conflict(new { message = "Email already exists." });
            user.Email = email;
        }

        if (!string.IsNullOrWhiteSpace(request.FirstName)) user.FirstName = request.FirstName.Trim();
        if (!string.IsNullOrWhiteSpace(request.LastName)) user.LastName = request.LastName.Trim();
        if (request.Description is not null) user.Description = request.Description.Trim();

        await _context.SaveChangesAsync();
        return Ok(new { message = "Profile updated successfully" });
    }

    [HttpPost("avatar")]
    [Consumes("multipart/form-data")]
    [EnableRateLimiting("uploads")]
    [RequestSizeLimit(ImageUploadValidator.MaxImageBytes)]
    public async Task<IActionResult> UploadAvatar([FromForm] UploadAvatarRequest request)
    {
        if (!ImageUploadValidator.TryValidateImage(request.File, out var errorMessage, out var extension))
            return BadRequest(new { message = errorMessage });

        var file = request.File!;

        var user = await _context.Users.FindAsync(User.GetUserId());
        if (user == null) return NotFound();

        var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        Directory.CreateDirectory(webRoot);
        var uploadsDir = Path.Combine(webRoot, "uploads", "users");
        Directory.CreateDirectory(uploadsDir);

        var fileName = $"{user.Id}{extension}";
        var fullPath = Path.Combine(uploadsDir, fileName);

        await using (var stream = System.IO.File.Create(fullPath))
            await file.CopyToAsync(stream);

        user.AvatarUrl = $"/uploads/users/{fileName}";
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Avatar updated",
            avatarUrl = ToVersionedStaticFileUrl(user.AvatarUrl)
        });
    }

    [HttpGet("bookmarks")]
    public async Task<IActionResult> GetMyBookmarkedPosts()
    {
        var me = User.GetUserId();
        var bookmarks = await _context.ForumPostBookmarks
            .Where(b => b.UserId == me)
            .OrderByDescending(b => b.CreatedAt)
            .Include(b => b.ForumPost)
                .ThenInclude(p => p.User)
            .Include(b => b.ForumPost)
                .ThenInclude(p => p.Attachments)
            .Include(b => b.ForumPost)
                .ThenInclude(p => p.Replies)
            .Include(b => b.ForumPost)
                .ThenInclude(p => p.Bookmarks)
            .Include(b => b.ForumPost)
                .ThenInclude(p => p.Likes)
            .ToListAsync();

        return Ok(bookmarks.Select(b => ToForumPostResponse(b.ForumPost, me)));
    }

    [HttpPost("bookmarks")]
    public async Task<IActionResult> BookmarkPost([FromBody] BookmarkPostRequest request)
    {
        var me = User.GetUserId();
        var exists = await _context.ForumPosts.AnyAsync(p => p.Id == request.ForumPostId);
        if (!exists) return NotFound(new { message = "Post not found." });

        var already = await _context.ForumPostBookmarks.AnyAsync(b => b.UserId == me && b.ForumPostId == request.ForumPostId);
        if (already) return Ok(new { message = "Post already bookmarked." });

        _context.ForumPostBookmarks.Add(new Model.ForumPostBookmarkModel
        {
            UserId = me,
            ForumPostId = request.ForumPostId,
            CreatedAt = DateTimeOffset.UtcNow
        });

        await _context.SaveChangesAsync();
        return Ok(new { message = "Post bookmarked." });
    }

    [HttpDelete("bookmarks/{postId:guid}")]
    public async Task<IActionResult> RemoveBookmark(Guid postId)
    {
        var me = User.GetUserId();
        var bookmark = await _context.ForumPostBookmarks.FirstOrDefaultAsync(b => b.UserId == me && b.ForumPostId == postId);
        if (bookmark is null) return NotFound(new { message = "Bookmark not found." });

        _context.ForumPostBookmarks.Remove(bookmark);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private ForumPostResponse ToForumPostResponse(ForumPostModel post, long currentUserId)
    {
        const bool isBookmarkedByCurrentUser = true;

        return new ForumPostResponse(
            post.Id,
            post.UserId,
            GetDisplayName(post.User),
            ToVersionedStaticFileUrl(post.User.AvatarUrl),
            post.Content,
            post.Attachments.Select(a => a.Url).ToList(),
            post.CreatedAt,
            post.UpdatedAt,
            post.IsAReply,
            post.ReplyingToPostId,
            post.Replies.Count,
            isBookmarkedByCurrentUser,
            isBookmarkedByCurrentUser,
            post.Bookmarks.Count,
            post.Likes.Count,
            post.Likes.Any(l => l.UserId == currentUserId)
        );
    }

    private static string GetDisplayName(AppUser user)
    {
        var fullName = $"{user.FirstName} {user.LastName}".Trim();
        return string.IsNullOrWhiteSpace(fullName) ? user.Username : fullName;
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
