using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetCare.Api.Data;
using PetCare.Api.DTOs;
using PetCare.Api.Security;

namespace PetCare.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Policy = AuthConstants.Policies.AdminOnly)]
public class AdminModerationController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminModerationController(AppDbContext db)
    {
        _db = db;
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
        var user = await _db.Users.FindAsync(id);
        if (user is null)
        {
            return NotFound();
        }

        user.IsBanned = true;
        user.BannedAt = DateTimeOffset.UtcNow;
        user.BanReason = string.IsNullOrWhiteSpace(request.Reason) ? null : request.Reason.Trim();
        await _db.SaveChangesAsync();

        return Ok(new { message = "User banned." });
    }

    [HttpPost("users/{id:long}/unban")]
    public async Task<IActionResult> UnbanUser(long id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user is null)
        {
            return NotFound();
        }

        user.IsBanned = false;
        user.BannedAt = null;
        user.BanReason = null;
        await _db.SaveChangesAsync();

        return Ok(new { message = "User unbanned." });
    }

    [HttpDelete("forum-posts/{id:guid}")]
    public async Task<IActionResult> DeleteForumPost(Guid id)
    {
        var post = await _db.ForumPosts.FirstOrDefaultAsync(p => p.Id == id);
        if (post is null)
        {
            return NotFound();
        }

        _db.ForumPosts.Remove(post);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
