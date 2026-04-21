using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetCare.Api.Data;
using PetCare.Api.DTOs;
using PetCare.Api.Security;

namespace PetCare.Api.Controllers;

[ApiController]
[Route("api/admin/auth")]
public class AdminAuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _cfg;

    public AdminAuthController(AppDbContext db, IConfiguration cfg)
    {
        _db = db;
        _cfg = cfg;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] AdminLoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var admin = await _db.AdminUsers.FirstOrDefaultAsync(a => a.Email == email);
        if (admin is null)
        {
            return Unauthorized();
        }

        if (!admin.IsActive)
        {
            return Unauthorized(new { message = "Admin account is inactive." });
        }

        if (!PasswordHasher.Verify(request.Password, admin.PasswordHash))
        {
            return Unauthorized();
        }

        admin.LastLogin = DateTimeOffset.UtcNow;
        admin.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        var token = JwtIssuer.CreateAdminToken(
            admin.Id.ToString(),
            admin.Username,
            admin.Email,
            admin.Role,
            _cfg["Jwt:Secret"]!,
            _cfg["Jwt:Issuer"]!,
            _cfg["Jwt:Audience"]!,
            int.Parse(_cfg["Jwt:Minutes"] ?? "60")
        );

        return Ok(new AdminAuthResponse(admin.Id, token, admin.Role));
    }
}
