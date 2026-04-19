using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetCare.Api.Data;
using PetCare.Api.DTOs;
using PetCare.Api.Security;

namespace PetCare.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
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
            user.AvatarUrl,
            user.Description,
            user.CreatedAt,
            user.LastLogin
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
    [RequestSizeLimit(5_000_000)]
    public async Task<IActionResult> UploadAvatar([FromForm] UploadAvatarRequest request)
    {
        var file = request.File;
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No file uploaded." });

        var allowed = new[] { "image/jpeg", "image/png", "image/webp" };
        if (!allowed.Contains(file.ContentType))
            return BadRequest(new { message = "Only JPG, PNG, WEBP are allowed." });

        var user = await _context.Users.FindAsync(User.GetUserId());
        if (user == null) return NotFound();

        var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var uploadsDir = Path.Combine(webRoot, "uploads", "users");
        Directory.CreateDirectory(uploadsDir);

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(ext)) ext = ".jpg";

        var fileName = $"{user.Id}{ext}";
        var fullPath = Path.Combine(uploadsDir, fileName);

        await using (var stream = System.IO.File.Create(fullPath))
            await file.CopyToAsync(stream);

        user.AvatarUrl = $"/uploads/users/{fileName}";
        await _context.SaveChangesAsync();

        return Ok(new { message = "Avatar updated", avatarUrl = user.AvatarUrl });
    }

    [HttpGet("bookmarks")]
    public async Task<IActionResult> GetMyBookmarkedPosts()
    {
        var me = User.GetUserId();
        var posts = await _context.ForumPostBookmarks
            .Where(b => b.UserId == me)
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new
            {
                b.ForumPost.Id,
                b.ForumPost.Content,
                b.ForumPost.CreatedAt,
                UserName = GetDisplayName(b.ForumPost.User)
            })
            .ToListAsync();

        return Ok(posts);
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

    private static string GetDisplayName(Model.AppUser user)
    {
        var fullName = $"{user.FirstName} {user.LastName}".Trim();
        return string.IsNullOrWhiteSpace(fullName) ? user.Username : fullName;
    }
}
