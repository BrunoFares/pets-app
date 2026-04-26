using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using PetCare.Api.Data;
using PetCare.Api.DTOs;
using PetCare.Api.Model;
using PetCare.Api.Security;
using PetCare.Api.Services;
using PetCare.Api.Services.Email;

namespace PetCare.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = AuthConstants.Policies.UserOnly)]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;
    private readonly IConfiguration _cfg;
    private readonly IEmailSender _emailSender;

    public UsersController(AppDbContext context, IWebHostEnvironment env, IConfiguration cfg, IEmailSender emailSender)
    {
        _context = context;
        _env = env;
        _cfg = cfg;
        _emailSender = emailSender;
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

        if (request.Username is not null)
        {
            var username = request.Username.Trim();
            if (string.IsNullOrWhiteSpace(username))
                return BadRequest(new { message = "Username cannot be empty." });

            var usernameTaken = await _context.Users.AnyAsync(u => u.Id != user.Id && u.Username == username);
            if (usernameTaken) return Conflict(new { message = "Username already exists." });
            user.Username = username;
        }

        if (request.FirstName is not null)
        {
            var firstName = request.FirstName.Trim();
            if (string.IsNullOrWhiteSpace(firstName))
                return BadRequest(new { message = "First name cannot be empty." });

            user.FirstName = firstName;
        }

        if (request.LastName is not null)
        {
            var lastName = request.LastName.Trim();
            if (string.IsNullOrWhiteSpace(lastName))
                return BadRequest(new { message = "Last name cannot be empty." });

            user.LastName = lastName;
        }

        if (request.Description is not null)
        {
            var description = request.Description.Trim();
            user.Description = string.IsNullOrWhiteSpace(description) ? null : description;
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Profile updated successfully" });
    }

    [HttpPost("change-password")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CurrentPassword) ||
            string.IsNullOrWhiteSpace(request.NewPassword) ||
            string.IsNullOrWhiteSpace(request.ConfirmNewPassword))
        {
            return BadRequest(new { message = "Current password, new password, and confirm password are required." });
        }

        if (!string.Equals(request.NewPassword, request.ConfirmNewPassword, StringComparison.Ordinal))
            return BadRequest(new { message = "New password and confirm password do not match." });

        var user = await _context.Users.FindAsync(User.GetUserId());
        if (user is null) return NotFound();

        if (!PasswordHasher.Verify(request.CurrentPassword, user.PasswordHash))
            return BadRequest(new { message = "Current password is incorrect." });

        if (PasswordHasher.Verify(request.NewPassword, user.PasswordHash))
            return BadRequest(new { message = "New password must be different from the current password." });

        var (ok, errors) = PasswordValidator.Validate(request.NewPassword, user.Username, user.Email, PasswordPolicies.UserAccount);
        if (!ok)
            return BadRequest(new { message = "Invalid password.", errors });

        user.PasswordHash = PasswordHasher.Hash(request.NewPassword);
        user.PasswordResetCodeHash = null;
        user.PasswordResetCodeExpiresAt = null;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Password changed successfully." });
    }

    [HttpPost("change-email/request")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> RequestEmailChange([FromBody] RequestEmailChangeRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.NewEmail) || string.IsNullOrWhiteSpace(request.CurrentPassword))
            return BadRequest(new { message = "New email and current password are required." });

        var user = await _context.Users.FindAsync(User.GetUserId());
        if (user is null) return NotFound();

        if (!PasswordHasher.Verify(request.CurrentPassword, user.PasswordHash))
            return BadRequest(new { message = "Current password is incorrect." });

        var newEmail = request.NewEmail.Trim().ToLowerInvariant();
        if (string.Equals(newEmail, user.Email, StringComparison.Ordinal))
            return BadRequest(new { message = "New email must be different from the current email." });

        var emailTaken = await _context.Users.AnyAsync(u => u.Id != user.Id && u.Email == newEmail);
        if (emailTaken)
            return Conflict(new { message = "Email already exists." });

        var verificationCode = EmailVerificationTokenService.GenerateToken();
        user.PendingNewEmail = newEmail;
        user.EmailChangeCodeHash = EmailVerificationTokenService.HashToken(verificationCode);
        user.EmailChangeCodeExpiresAt = DateTimeOffset.UtcNow.AddHours(GetEmailChangeCodeHours());

        await _context.SaveChangesAsync();
        await SendEmailChangeVerificationAsync(user, newEmail, verificationCode);

        return Ok(new { message = "A verification code has been sent to the new email address." });
    }

    [HttpPost("change-email/confirm")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> ConfirmEmailChange([FromBody] ConfirmEmailChangeRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Code))
            return BadRequest(new { message = "Verification code is required." });

        var code = request.Code.Trim();
        if (!EmailVerificationTokenService.IsValidTokenFormat(code))
            return BadRequest(new { message = "Verification code must be a 6-digit number." });

        var user = await _context.Users.FindAsync(User.GetUserId());
        if (user is null) return NotFound();

        if (string.IsNullOrWhiteSpace(user.PendingNewEmail) ||
            string.IsNullOrWhiteSpace(user.EmailChangeCodeHash) ||
            user.EmailChangeCodeExpiresAt is null)
        {
            return BadRequest(new { message = "No pending email change was found." });
        }

        if (user.EmailChangeCodeExpiresAt <= DateTimeOffset.UtcNow)
            return BadRequest(new { message = "Verification code has expired. Please request a new one." });

        var incomingCodeHash = EmailVerificationTokenService.HashToken(code);
        if (!string.Equals(incomingCodeHash, user.EmailChangeCodeHash, StringComparison.Ordinal))
            return BadRequest(new { message = "Invalid or expired verification code." });

        var emailTaken = await _context.Users.AnyAsync(u => u.Id != user.Id && u.Email == user.PendingNewEmail);
        if (emailTaken)
            return Conflict(new { message = "Email already exists." });

        user.Email = user.PendingNewEmail;
        user.EmailVerified = true;
        user.EmailVerificationTokenHash = null;
        user.EmailVerificationTokenExpiresAt = null;
        user.PendingNewEmail = null;
        user.EmailChangeCodeHash = null;
        user.EmailChangeCodeExpiresAt = null;

        await _context.SaveChangesAsync();

        var token = JwtIssuer.CreateUserToken(
            user.Id.ToString(),
            user.Username,
            user.Email,
            _cfg["Jwt:Secret"]!,
            _cfg["Jwt:Issuer"]!,
            _cfg["Jwt:Audience"]!,
            int.Parse(_cfg["Jwt:Minutes"] ?? "60")
        );

        return Ok(new
        {
            message = "Email changed successfully.",
            email = user.Email,
            accessToken = token
        });
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

    private int GetEmailChangeCodeHours()
    {
        return int.TryParse(_cfg["Email:EmailChangeCodeHours"], out var hours) ? hours : 24;
    }

    private async Task SendEmailChangeVerificationAsync(AppUser user, string newEmail, string verificationCode)
    {
        var recipientName = GetDisplayName(user);
        await _emailSender.SendEmailChangeVerificationEmailAsync(newEmail, recipientName, verificationCode);
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
