using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetCare.Api.Data;
using PetCare.Api.DTOs;
using PetCare.Api.Model;
using PetCare.Api.Security;

namespace PetCare.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = AuthConstants.Policies.UserOnly)]
public class PetsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;

    public PetsController(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    [HttpGet]
    public async Task<IActionResult> GetMyPets()
    {
        var me = User.GetUserId();
        var pets = await _db.Pets
            .Where(p => p.UserId == me)
            .Include(p => p.Species)
            .Include(p => p.Breed)
            .OrderBy(p => p.Name)
            .ToListAsync();

        return Ok(pets.Select(ToPetResponse));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var me = User.GetUserId();
        var pet = await _db.Pets
            .Include(p => p.Species)
            .Include(p => p.Breed)
            .FirstOrDefaultAsync(p => p.Id == id && p.UserId == me);

        return pet is null ? NotFound() : Ok(ToPetResponse(pet));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePetRequest request)
    {
        var me = User.GetUserId();

        if (!await _db.Species.AnyAsync(s => s.Id == request.SpeciesId))
            return BadRequest(new { message = "Invalid species." });

        if (request.BreedId is int breedId)
        {
            var breedBelongs = await _db.Breeds.AnyAsync(b => b.Id == breedId && b.SpeciesId == request.SpeciesId);
            if (!breedBelongs)
                return BadRequest(new { message = "Breed does not belong to the selected species." });
        }

        var pet = new PetModel
        {
            Id = Guid.NewGuid(),
            UserId = me,
            Name = request.Name.Trim(),
            SpeciesId = request.SpeciesId,
            BreedId = request.BreedId,
            Sex = request.Sex,
            BirthDate = request.BirthDate,
            WeightKg = request.WeightKg,
            Color = request.Color,
            Neutered = request.Neutered,
            Notes = request.Notes?.Trim(),
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        _db.Pets.Add(pet);
        await _db.SaveChangesAsync();

        var created = await _db.Pets.Include(p => p.Species).Include(p => p.Breed).FirstAsync(p => p.Id == pet.Id);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, ToPetResponse(created));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePetRequest request)
    {
        var me = User.GetUserId();
        var pet = await _db.Pets.FirstOrDefaultAsync(p => p.Id == id && p.UserId == me);
        if (pet == null) return NotFound();

        if (!await _db.Species.AnyAsync(s => s.Id == request.SpeciesId))
            return BadRequest(new { message = "Invalid species." });

        if (request.BreedId is int breedId)
        {
            var breedBelongs = await _db.Breeds.AnyAsync(b => b.Id == breedId && b.SpeciesId == request.SpeciesId);
            if (!breedBelongs)
                return BadRequest(new { message = "Breed does not belong to the selected species." });
        }

        pet.Name = request.Name.Trim();
        pet.SpeciesId = request.SpeciesId;
        pet.BreedId = request.BreedId;
        pet.Sex = request.Sex;
        pet.BirthDate = request.BirthDate;
        pet.WeightKg = request.WeightKg;
        pet.Color = request.Color;
        pet.Neutered = request.Neutered;
        pet.Notes = request.Notes?.Trim();
        pet.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();

        var updated = await _db.Pets.Include(p => p.Species).Include(p => p.Breed).FirstAsync(p => p.Id == id);
        return Ok(ToPetResponse(updated));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var me = User.GetUserId();
        var pet = await _db.Pets.FirstOrDefaultAsync(p => p.Id == id && p.UserId == me);
        if (pet is null) return NotFound();

        _db.Pets.Remove(pet);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:guid}/avatar")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(5_000_000)]
    public async Task<IActionResult> UploadAvatar(Guid id, [FromForm] UploadAvatarRequest request)
    {
        var me = User.GetUserId();
        var pet = await _db.Pets.FirstOrDefaultAsync(p => p.Id == id && p.UserId == me);
        if (pet is null) return NotFound();

        var file = request.File;
        if (file == null || file.Length == 0) return BadRequest(new { message = "No file uploaded." });

        var allowed = new[] { "image/jpeg", "image/png", "image/webp" };
        if (!allowed.Contains(file.ContentType)) return BadRequest(new { message = "Only JPG, PNG, WEBP are allowed." });

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(ext)) ext = ".jpg";

        var root = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var petDir = Path.Combine(root, "uploads", "pets", id.ToString());
        Directory.CreateDirectory(petDir);

        var outPath = Path.Combine(petDir, "avatar" + ext);
        await using (var fs = System.IO.File.Create(outPath))
            await file.CopyToAsync(fs);

        pet.AvatarUrl = $"/uploads/pets/{id}/avatar{ext}";
        pet.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { avatarUrl = pet.AvatarUrl });
    }

    [HttpGet("{id:guid}/consultations")]
    public async Task<IActionResult> GetConsultationsForPet(Guid id)
    {
        var me = User.GetUserId();
        var petExists = await _db.Pets.AnyAsync(p => p.Id == id && p.UserId == me);
        if (!petExists) return NotFound();

        var items = await _db.Consultations
            .Where(c => c.PetId == id && c.UserId == me)
            .OrderByDescending(c => c.Date)
            .Select(c => new ConsultationResponse(c.Id, c.PetId, c.VetPlaceId, c.VetPlace != null ? c.VetPlace.Name : null, c.Date, c.Details, c.CreatedAt, c.UpdatedAt))
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("{id:guid}/vaccines")]
    public async Task<IActionResult> GetVaccineRecordsForPet(Guid id)
    {
        var me = User.GetUserId();
        var petExists = await _db.Pets.AnyAsync(p => p.Id == id && p.UserId == me);
        if (!petExists) return NotFound();

        var items = await _db.VaccineRecords
            .Where(v => v.PetId == id)
            .OrderByDescending(v => v.CreatedAt)
            .Select(v => new VaccineRecordResponse(v.Id, v.PetId, v.VaccineName, v.Status, v.DateAdministered, v.NextDueDate, v.Notes, v.Veterinarian, v.CreatedAt, v.UpdatedAt))
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("{id:guid}/illnesses")]
    public async Task<IActionResult> GetIllnessRecordsForPet(Guid id)
    {
        var me = User.GetUserId();
        var petExists = await _db.Pets.AnyAsync(p => p.Id == id && p.UserId == me);
        if (!petExists) return NotFound();

        var items = await _db.IllnessRecords
            .Where(i => i.PetId == id)
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => new IllnessRecordResponse(
                i.Id,
                i.PetId,
                i.IllnessName,
                i.DiagnosisDate,
                i.Status,
                i.Description,
                i.Notes,
                i.CuredDate,
                i.CreatedAt,
                i.UpdatedAt,
                i.Medications.Select(m => m.Id).ToList()
            ))
            .ToListAsync();

        return Ok(items);
    }

    private static PetResponse ToPetResponse(PetModel pet) => new(
        pet.Id,
        pet.UserId,
        pet.Name,
        pet.SpeciesId,
        pet.Species.Name,
        pet.BreedId,
        pet.Breed?.Name,
        pet.Sex,
        pet.BirthDate,
        pet.WeightKg,
        pet.Color,
        pet.Neutered,
        pet.AvatarUrl,
        pet.Notes,
        pet.CreatedAt,
        pet.UpdatedAt
    );
}
