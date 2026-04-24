using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using PetCare.Api.Data;
using PetCare.Api.DTOs;
using PetCare.Api.Security;
using PetCare.Api.Services;

namespace PetCare.Api.Controllers;

[ApiController]
[Route("api/admin/auth")]
public class AdminAuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _cfg;
    private readonly AdminAuditLogger _auditLogger;

    public AdminAuthController(AppDbContext db, IConfiguration cfg, AdminAuditLogger auditLogger)
    {
        _db = db;
        _cfg = cfg;
        _auditLogger = auditLogger;
    }

    [EnableRateLimiting("auth")]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] AdminLoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Email or username and password are required." });
        }

        var identifier = request.Email.Trim();
        var normalizedIdentifier = identifier.ToLowerInvariant();
        var admin = await _db.AdminUsers.FirstOrDefaultAsync(a =>
            a.Email == normalizedIdentifier ||
            a.Username.ToLower() == normalizedIdentifier);
        if (admin is null)
        {
            return Unauthorized(new { message = "Invalid admin email/username or password." });
        }

        if (!admin.IsActive)
        {
            return Unauthorized(new { message = "Admin account is inactive." });
        }

        if (!PasswordHasher.Verify(request.Password, admin.PasswordHash))
        {
            return Unauthorized(new { message = "Invalid admin email/username or password." });
        }

        var now = DateTimeOffset.UtcNow;
        admin.LastLogin = now;
        admin.UpdatedAt = now;
        _auditLogger.Log(
            admin.Id,
            "AdminLogin",
            "AdminUser",
            admin.Id.ToString(),
            $"Admin '{admin.Username}' logged in."
        );
        await _db.SaveChangesAsync();

        var tokenLifetimeMinutes = int.Parse(_cfg["Jwt:Minutes"] ?? "60");
        var token = JwtIssuer.CreateAdminToken(
            admin.Id.ToString(),
            admin.Username,
            admin.Email,
            admin.Role,
            _cfg["Jwt:Secret"]!,
            _cfg["Jwt:Issuer"]!,
            _cfg["Jwt:Audience"]!,
            tokenLifetimeMinutes
        );

        Response.Cookies.Append(
            AuthConstants.Cookies.AdminAccessToken,
            token,
            new CookieOptions
            {
                HttpOnly = true,
                IsEssential = true,
                Path = "/",
                SameSite = SameSiteMode.Lax,
                Secure = Request.IsHttps,
                Expires = DateTimeOffset.UtcNow.AddMinutes(tokenLifetimeMinutes)
            });

        return Ok(new AdminAuthResponse(admin.Id, token, admin.Role));
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete(
            AuthConstants.Cookies.AdminAccessToken,
            new CookieOptions
            {
                Path = "/",
                SameSite = SameSiteMode.Lax,
                Secure = Request.IsHttps
            });

        return NoContent();
    }
}
