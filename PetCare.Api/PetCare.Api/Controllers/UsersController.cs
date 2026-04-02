using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetCare.Api.DTOs;
using PetCare.Api.Data;
using PetCare.Api.Model;
using System.Security.Claims;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;

    public UsersController(AppDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    private long Me() =>
    long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!);

    [Authorize]
    [HttpPut("edit-profile")]
    public async Task<IActionResult> EditProfile(UpdateProfileRequest request)
    {
        var user = await _context.Users.FindAsync(Me());

        if (user == null)
            return NotFound();

        if (user == null)
            return NotFound();

        if (!string.IsNullOrWhiteSpace(request.FirstName))
            user.FirstName = request.FirstName.Trim();

        if (!string.IsNullOrWhiteSpace(request.LastName))
            user.LastName = request.LastName.Trim();

        if (!string.IsNullOrWhiteSpace(request.PhoneNumber))
            user.PhoneNumber = request.PhoneNumber.Trim();

        await _context.SaveChangesAsync();

        return Ok(new { message = "Profile updated successfully" });
    }

    [Authorize]
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

        var user = await _context.Users.FindAsync(Me());
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

        return Ok(new
        {
            message = "Avatar updated",
            avatarUrl = user.AvatarUrl
        });
    }
}
