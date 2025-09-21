// File: Controllers/PetsController.cs
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetCare.Api.Data;
using PetCare.Api.Model;
using PetCare.Api.Models;

namespace PetCare.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PetsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;

    public PetsController(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db; _env = env;
    }

    // DTOs inline (simple)
    public record PetCreateDto(
        string Name, int SpeciesId, int? BreedId, string Sex = "unknown",
        DateTime? BirthDate = null, int? ApproxAgeMonths = null, decimal? WeightKg = null,
        string? Color = null, bool Neutered = false, string? Notes = null
    );

    public record PetUpdateDto(
        string Name, int SpeciesId, int? BreedId, string Sex,
        DateTime? BirthDate, int? ApproxAgeMonths, decimal? WeightKg,
        string? Color, bool Neutered, string? Notes
    );

    private long Me() =>
        long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!);

    [HttpPost("create")]
    public async Task<IActionResult> Create([FromBody] PetCreateDto dto)
    {
        // Validate breed belongs to species
        if (dto.BreedId is int bid)
        {
            var ok = await _db.Breeds.AnyAsync(b => b.Id == bid && b.SpeciesId == dto.SpeciesId);
            if (!ok) return BadRequest(new { error = "Breed does not belong to the given species." });
        }

        var pet = new PetModel
        {
            Id = Guid.NewGuid(),
            UserId = Me(),
            Name = dto.Name.Trim(),
            SpeciesId = dto.SpeciesId,
            BreedId = dto.BreedId,
            Sex = Enum.TryParse<PetSex>(dto.Sex, true, out var sex) ? sex : PetSex.Unknown,
            BirthDate = dto.BirthDate,
            ApproxAgeMonths = dto.ApproxAgeMonths,
            WeightKg = dto.WeightKg,
            Color = dto.Color,
            Neutered = dto.Neutered,
            Notes = dto.Notes
        };
        _db.Pets.Add(pet);
        await _db.SaveChangesAsync();

        var res = await _db.Pets.Include(p => p.Species).Include(p => p.Breed)
            .FirstAsync(p => p.Id == pet.Id);
        return CreatedAtAction(nameof(GetOne), new { id = pet.Id }, res);
    }

    [HttpGet("list")]
    public async Task<IActionResult> List()
    {
        var me = Me();
        var list = await _db.Pets
            .Where(p => p.UserId == me)
            .Include(p => p.Species)
            .Include(p => p.Breed)
            .OrderBy(p => p.Name)
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetOne(Guid id)
    {
        var me = Me();
        var pet = await _db.Pets
            .Include(p => p.Species)
            .Include(p => p.Breed)
            .FirstOrDefaultAsync(p => p.Id == id && p.UserId == me);
        return pet is null ? NotFound() : Ok(pet);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] PetUpdateDto dto)
    {
        var me = Me();
        var pet = await _db.Pets.FirstOrDefaultAsync(p => p.Id == id && p.UserId == me);
        if (pet is null) return NotFound();

        if (dto.BreedId is int bid)
        {
            var ok = await _db.Breeds.AnyAsync(b => b.Id == bid && b.SpeciesId == dto.SpeciesId);
            if (!ok) return BadRequest(new { error = "Breed does not belong to the given species." });
        }

        pet.Name = dto.Name.Trim();
        pet.SpeciesId = dto.SpeciesId;
        pet.BreedId = dto.BreedId;
        pet.Sex = Enum.TryParse<PetSex>(dto.Sex, true, out var sex) ? sex : PetSex.Unknown;
        pet.BirthDate = dto.BirthDate;
        pet.ApproxAgeMonths = dto.ApproxAgeMonths;
        pet.WeightKg = dto.WeightKg;
        pet.Color = dto.Color;
        pet.Neutered = dto.Neutered;
        pet.Notes = dto.Notes;
        pet.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();

        var res = await _db.Pets.Include(p => p.Species).Include(p => p.Breed)
            .FirstAsync(p => p.Id == id);
        return Ok(res);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var me = Me();
        var pet = await _db.Pets.FirstOrDefaultAsync(p => p.Id == id && p.UserId == me);
        if (pet is null) return NotFound();

        _db.Pets.Remove(pet);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // DEV-only: simple avatar upload to wwwroot.
    // In production, prefer pre-signed S3/R2 and set AvatarUrl directly.
    [HttpPost("{id:guid}/avatar")]
    [RequestSizeLimit(10_000_000)]
    public async Task<IActionResult> UploadAvatar(Guid id, IFormFile file)
    {
        var me = Me();
        var pet = await _db.Pets.FirstOrDefaultAsync(p => p.Id == id && p.UserId == me);
        if (pet is null) return NotFound();

        if (file is null || file.Length == 0) return BadRequest(new { error = "No file uploaded." });
        var allowed = new[] { "image/jpeg", "image/png", "image/webp", "image/svg+xml" };
        if (!allowed.Contains(file.ContentType)) return BadRequest(new { error = "Unsupported file type." });

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var root = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var petDir = Path.Combine(root, "uploads", "pets", id.ToString());
        Directory.CreateDirectory(petDir);

        var outPath = Path.Combine(petDir, "avatar" + ext);
        await using (var fs = System.IO.File.Create(outPath))
            await file.CopyToAsync(fs);

        var publicUrl = $"/uploads/pets/{id}/avatar{ext}";
        pet.AvatarUrl = publicUrl;
        pet.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { avatarUrl = publicUrl });
    }
}
