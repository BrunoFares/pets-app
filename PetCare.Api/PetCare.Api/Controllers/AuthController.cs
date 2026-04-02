using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetCare.Api.Data;
using PetCare.Api.DTOs;
using PetCare.Api.Model;
using PetCare.Api.Security;
using System.ComponentModel.DataAnnotations;

namespace PetCare.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _cfg;

    public AuthController(AppDbContext context, IConfiguration cfg) { _context = context; _cfg = cfg; }

    public record RegisterRequest([Required] string Username, [Required, EmailAddress] string Email,
        [Required] string PhoneNumber, [Required] string FirstName, [Required] string LastName,
        [Required, StringLength(64, MinimumLength = 8)] string Password);

    public record LoginRequest([Required, EmailAddress] string Email, [Required] string Password);
    public record AuthResponse(long UserId, string AccessToken);

    // Register user controller
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        var email = req.Email.Trim().ToLowerInvariant();

        var (ok, errors) = PasswordValidator.Validate(req.Password, req.Username.Trim(), email, new PasswordPolicy(
            MinLength: 8, MaxLength: 64,
            RequireUpper: true, RequireLower: true, RequireDigit: true, RequireSpecial: true,
            DisallowedChars: new[] { ' ', '\"', '\'', '\\' }, DisallowWhitespace: true
        ));
        if (!ok) return BadRequest(new { message = "Invalid password.", errors });

        if (await _context.Users.AnyAsync(u => u.Email == email))
            return Conflict(new { message = "Email already exists." });

        var user = new AppUser
        {
            Username = req.Username.Trim(),
            Email = email,
            PhoneNumber = req.PhoneNumber,
            FirstName = req.FirstName,
            LastName = req.LastName,
            PasswordHash = PasswordHasher.Hash(req.Password)
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var token = JwtIssuer.Create(user.Id.ToString(), user.Username, user.Email,
            _cfg["Jwt:Secret"]!, _cfg["Jwt:Issuer"]!, _cfg["Jwt:Audience"]!,
            int.Parse(_cfg["Jwt:Minutes"] ?? "60"));

        return Ok(new AuthResponse(user.Id, token));
    }

    // User login controller
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user is null) return Unauthorized();

        if (!PasswordHasher.Verify(req.Password, user.PasswordHash)) return Unauthorized();

        user.LastLogin = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync();

        var token = JwtIssuer.Create(user.Id.ToString(), user.Username, user.Email,
            _cfg["Jwt:Secret"]!, _cfg["Jwt:Issuer"]!, _cfg["Jwt:Audience"]!,
            int.Parse(_cfg["Jwt:Minutes"] ?? "60"));

        return Ok(new AuthResponse(user.Id, token));
    }

    // User logout controller(it has no actual use just a confirmation)
    [Authorize]
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        return Ok(new { message = "Logged out" });
    }

}
