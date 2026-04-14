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
[Authorize]
public class VaccinesController : ControllerBase
{
    private readonly AppDbContext _db;

    public VaccinesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("pet/{petId:guid}")]
    public async Task<IActionResult> GetByPet(Guid petId)
    {
        var me = User.GetUserId();
        var petBelongs = await _db.Pets.AnyAsync(p => p.Id == petId && p.UserId == me);
        if (!petBelongs) return Forbid();

        var items = await _db.VaccineRecords
            .Where(v => v.PetId == petId)
            .OrderByDescending(v => v.CreatedAt)
            .Select(v => new VaccineRecordResponse(v.Id, v.PetId, v.VaccineName, v.Status, v.DateAdministered, v.NextDueDate, v.Notes, v.Veterinarian, v.CreatedAt, v.UpdatedAt))
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateVaccineRecordRequest request)
    {
        var me = User.GetUserId();
        var petBelongs = await _db.Pets.AnyAsync(p => p.Id == request.PetId && p.UserId == me);
        if (!petBelongs) return Forbid();

        var entity = new VaccineRecordModel
        {
            PetId = request.PetId,
            VaccineName = request.VaccineName.Trim(),
            Status = request.Status,
            DateAdministered = request.DateAdministered,
            NextDueDate = request.NextDueDate,
            Notes = request.Notes?.Trim(),
            Veterinarian = request.Veterinarian?.Trim(),
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        _db.VaccineRecords.Add(entity);
        await _db.SaveChangesAsync();

        return Ok(new { entity.Id });
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(long id, [FromBody] UpdateVaccineRecordRequest request)
    {
        var me = User.GetUserId();
        var entity = await _db.VaccineRecords
            .Include(v => v.Pet)
            .FirstOrDefaultAsync(v => v.Id == id);

        if (entity is null) return NotFound();
        if (entity.Pet.UserId != me) return Forbid();

        entity.VaccineName = request.VaccineName.Trim();
        entity.Status = request.Status;
        entity.DateAdministered = request.DateAdministered;
        entity.NextDueDate = request.NextDueDate;
        entity.Notes = request.Notes?.Trim();
        entity.Veterinarian = request.Veterinarian?.Trim();
        entity.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new { message = "Vaccine record updated." });
    }

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id)
    {
        var me = User.GetUserId();
        var entity = await _db.VaccineRecords
            .Include(v => v.Pet)
            .FirstOrDefaultAsync(v => v.Id == id);

        if (entity is null) return NotFound();
        if (entity.Pet.UserId != me) return Forbid();

        _db.VaccineRecords.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("due")]
    public async Task<IActionResult> GetDueVaccines()
    {
        var me = User.GetUserId();
        var now = DateTimeOffset.UtcNow;

        var items = await _db.VaccineRecords
            .Where(v => v.Pet.UserId == me && (v.Status == VaccineStatus.Due || (v.NextDueDate.HasValue && v.NextDueDate <= now)))
            .OrderBy(v => v.NextDueDate)
            .Select(v => new VaccineRecordResponse(v.Id, v.PetId, v.VaccineName, v.Status, v.DateAdministered, v.NextDueDate, v.Notes, v.Veterinarian, v.CreatedAt, v.UpdatedAt))
            .ToListAsync();

        return Ok(items);
    }
}
