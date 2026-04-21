using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetCare.Api.Data;
using PetCare.Api.DTOs;
using PetCare.Api.Security;

namespace PetCare.Api.Controllers;

[ApiController]
[Route("api/admin/profile")]
[Authorize(Policy = AuthConstants.Policies.AdminOnly)]
public class AdminProfileController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminProfileController(AppDbContext db)
    {
        _db = db;
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
