using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using PetCare.Api.Data;
using PetCare.Api.DTOs;
using PetCare.Api.Security;
using PetCare.Api.Services;

namespace PetCare.Api.Controllers;

[ApiController]
[Route("api/admin/profile")]
[Authorize(Policy = AuthConstants.Policies.AdminOnly)]
public class AdminProfileController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AdminAuditLogger _auditLogger;

    public AdminProfileController(AppDbContext db, AdminAuditLogger auditLogger)
    {
        _db = db;
        _auditLogger = auditLogger;
    }

    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var admin = await _db.AdminUsers.FindAsync(User.GetAdminId());
        if (admin is null)
        {
            return NotFound();
        }

        return Ok(ToProfileResponse(admin));
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateAdminProfileRequest request)
    {
        var admin = await _db.AdminUsers.FindAsync(User.GetAdminId());
        if (admin is null)
        {
            return NotFound();
        }

        if (!string.IsNullOrWhiteSpace(request.Username))
        {
            var username = request.Username.Trim();
            var usernameTaken = await _db.AdminUsers.AnyAsync(a => a.Id != admin.Id && a.Username == username);
            if (usernameTaken)
            {
                return Conflict(new { message = "Username already exists." });
            }

            admin.Username = username;
        }

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var email = request.Email.Trim().ToLowerInvariant();
            var emailTaken = await _db.AdminUsers.AnyAsync(a => a.Id != admin.Id && a.Email == email);
            if (emailTaken)
            {
                return Conflict(new { message = "Email already exists." });
            }

            admin.Email = email;
        }

        if (!string.IsNullOrWhiteSpace(request.FirstName))
        {
            admin.FirstName = request.FirstName.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.LastName))
        {
            admin.LastName = request.LastName.Trim();
        }

        admin.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(ToProfileResponse(admin));
    }

    [HttpPost("change-password")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangeAdminPasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CurrentPassword) ||
            string.IsNullOrWhiteSpace(request.NewPassword) ||
            string.IsNullOrWhiteSpace(request.ConfirmNewPassword))
        {
            return BadRequest(new { message = "Current password, new password, and confirm password are required." });
        }

        if (!string.Equals(request.NewPassword, request.ConfirmNewPassword, StringComparison.Ordinal))
        {
            return BadRequest(new { message = "New password and confirm password do not match." });
        }

        var admin = await _db.AdminUsers.FindAsync(User.GetAdminId());
        if (admin is null)
        {
            return NotFound();
        }

        if (!PasswordHasher.Verify(request.CurrentPassword, admin.PasswordHash))
        {
            return BadRequest(new { message = "Current password is incorrect." });
        }

        if (PasswordHasher.Verify(request.NewPassword, admin.PasswordHash))
        {
            return BadRequest(new { message = "New password must be different from the current password." });
        }

        var (ok, errors) = PasswordValidator.Validate(request.NewPassword, admin.Username, admin.Email, PasswordPolicies.UserAccount);
        if (!ok)
        {
            return BadRequest(new { message = "Invalid password.", errors });
        }

        admin.PasswordHash = PasswordHasher.Hash(request.NewPassword);
        admin.UpdatedAt = DateTimeOffset.UtcNow;
        _auditLogger.Log(
            admin.Id,
            "ChangeAdminPassword",
            "AdminUser",
            admin.Id.ToString(),
            $"Admin '{admin.Username}' changed their own password."
        );

        await _db.SaveChangesAsync();
        return Ok(new { message = "Password changed successfully." });
    }

    private static AdminProfileResponse ToProfileResponse(Model.AdminUser admin) => new(
        admin.Id,
        admin.Username,
        admin.FirstName,
        admin.LastName,
        admin.Email,
        admin.Role,
        admin.IsActive,
        admin.CreatedAt,
        admin.UpdatedAt,
        admin.LastLogin
    );
}
