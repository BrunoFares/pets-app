using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetCare.Api.Data;
using PetCare.Api.Model;
using PetCare.Api.Security;
using PetCare.Api.Services.Email;

namespace PetCare.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private const string PendingVerificationMessage = "Please verify your email before logging in.";
    private readonly AppDbContext _context;
    private readonly IConfiguration _cfg;
    private readonly IEmailSender _emailSender;

    public AuthController(AppDbContext context, IConfiguration cfg, IEmailSender emailSender)
    {
        _context = context;
        _cfg = cfg;
        _emailSender = emailSender;
    }

    public record RegisterRequest(
        [Required] string Username,
        [Required, EmailAddress] string Email,
        [Required] string FirstName,
        [Required] string LastName,
        [Required, StringLength(64, MinimumLength = 8)] string Password
    );

    public record LoginRequest([Required, EmailAddress] string Email, [Required] string Password);
    public record ResendVerificationRequest([Required, EmailAddress] string Email);
    public record AuthResponse(long UserId, string AccessToken);
    public record RegistrationResponse(long UserId, string Message);

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        var username = req.Username.Trim();

        var (ok, errors) = PasswordValidator.Validate(req.Password, username, email, new PasswordPolicy(
            MinLength: 8,
            MaxLength: 64,
            RequireUpper: true,
            RequireLower: true,
            RequireDigit: true,
            RequireSpecial: true,
            DisallowedChars: new[] { ' ', '"', '\'', '\\' },
            DisallowWhitespace: true
        ));

        if (!ok) return BadRequest(new { message = "Invalid password.", errors });

        if (await _context.Users.AnyAsync(u => u.Email == email))
            return Conflict(new { message = "Email already exists." });

        if (await _context.Users.AnyAsync(u => u.Username == username))
            return Conflict(new { message = "Username already exists." });

        var user = new AppUser
        {
            Username = username,
            Email = email,
            FirstName = req.FirstName.Trim(),
            LastName = req.LastName.Trim(),
            PasswordHash = PasswordHasher.Hash(req.Password)
        };

        var verificationToken = EmailVerificationTokenService.GenerateToken();
        user.EmailVerificationTokenHash = EmailVerificationTokenService.HashToken(verificationToken);
        user.EmailVerificationTokenExpiresAt = DateTimeOffset.UtcNow.AddHours(GetVerificationTokenHours());

        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        await SendVerificationEmailAsync(user, verificationToken);
        return Ok(new RegistrationResponse(
            user.Id,
            "Registration successful. Please verify your email before logging in."
        ));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user is null) return Unauthorized();

        if (!PasswordHasher.Verify(req.Password, user.PasswordHash))
            return Unauthorized();

        if (!user.EmailVerified)
            return Unauthorized(new { message = PendingVerificationMessage });

        user.LastLogin = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync();

        var token = JwtIssuer.Create(
            user.Id.ToString(),
            user.Username,
            user.Email,
            _cfg["Jwt:Secret"]!,
            _cfg["Jwt:Issuer"]!,
            _cfg["Jwt:Audience"]!,
            int.Parse(_cfg["Jwt:Minutes"] ?? "60")
        );

        return Ok(new AuthResponse(user.Id, token));
    }

    [HttpGet("verify-email")]
    public async Task<IActionResult> VerifyEmail([FromQuery, Required, EmailAddress] string email, [FromQuery, Required] string token)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail);
        if (user is null)
            return BadRequest(new { message = "Invalid or expired verification link." });

        if (user.EmailVerified)
            return Ok(new { message = "Email is already verified." });

        if (string.IsNullOrWhiteSpace(user.EmailVerificationTokenHash) || user.EmailVerificationTokenExpiresAt is null)
            return BadRequest(new { message = "Invalid or expired verification link." });

        if (user.EmailVerificationTokenExpiresAt <= DateTimeOffset.UtcNow)
            return BadRequest(new { message = "Verification link has expired. Please request a new one." });

        var incomingTokenHash = EmailVerificationTokenService.HashToken(token);
        if (!string.Equals(incomingTokenHash, user.EmailVerificationTokenHash, StringComparison.Ordinal))
            return BadRequest(new { message = "Invalid or expired verification link." });

        user.EmailVerified = true;
        user.EmailVerificationTokenHash = null;
        user.EmailVerificationTokenExpiresAt = null;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Email verified successfully. You can now log in." });
    }

    [HttpPost("resend-verification")]
    public async Task<IActionResult> ResendVerification([FromBody] ResendVerificationRequest req)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user is null)
        {
            return Ok(new { message = "If the account exists and is not verified, a verification email has been sent." });
        }

        if (user.EmailVerified)
            return Ok(new { message = "Email is already verified." });

        var verificationToken = EmailVerificationTokenService.GenerateToken();
        user.EmailVerificationTokenHash = EmailVerificationTokenService.HashToken(verificationToken);
        user.EmailVerificationTokenExpiresAt = DateTimeOffset.UtcNow.AddHours(GetVerificationTokenHours());

        await _context.SaveChangesAsync();
        await SendVerificationEmailAsync(user, verificationToken);

        return Ok(new { message = "If the account exists and is not verified, a verification email has been sent." });
    }

    [Authorize]
    [HttpPost("logout")]
    public IActionResult Logout() => Ok(new { message = "Logged out" });

    private int GetVerificationTokenHours()
    {
        return int.TryParse(_cfg["Email:VerificationTokenHours"], out var hours) ? hours : 24;
    }

    private async Task SendVerificationEmailAsync(AppUser user, string rawToken)
    {
        var verificationBaseUrl = _cfg["Email:FrontendVerificationUrlBase"]?.Trim();
        if (string.IsNullOrWhiteSpace(verificationBaseUrl))
            throw new InvalidOperationException("Missing Email:FrontendVerificationUrlBase configuration.");

        var separator = verificationBaseUrl.Contains('?', StringComparison.Ordinal) ? "&" : "?";
        var verificationLink =
            $"{verificationBaseUrl}{separator}email={Uri.EscapeDataString(user.Email)}&token={Uri.EscapeDataString(rawToken)}";

        var recipientName = $"{user.FirstName} {user.LastName}".Trim();
        await _emailSender.SendVerificationEmailAsync(user.Email, recipientName, verificationLink);
    }
}
