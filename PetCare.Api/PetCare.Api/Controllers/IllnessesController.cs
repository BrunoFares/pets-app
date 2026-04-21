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
public class IllnessesController : ControllerBase
{
    private readonly AppDbContext _db;

    public IllnessesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("pet/{petId:guid}")]
    public async Task<IActionResult> GetByPet(Guid petId)
    {
        var me = User.GetUserId();
        var petBelongs = await _db.Pets.AnyAsync(p => p.Id == petId && p.UserId == me);
        if (!petBelongs) return Forbid();

        var items = await _db.IllnessRecords
            .Where(i => i.PetId == petId)
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
                i.Medications.Select(m => m.Id).ToList()))
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateIllnessRecordRequest request)
    {
        var me = User.GetUserId();
        var petBelongs = await _db.Pets.AnyAsync(p => p.Id == request.PetId && p.UserId == me);
        if (!petBelongs) return Forbid();

        var entity = new IllnessRecordModel
        {
            PetId = request.PetId,
            IllnessName = request.IllnessName.Trim(),
            DiagnosisDate = request.DiagnosisDate,
            Status = request.Status,
            Description = request.Description?.Trim(),
            Notes = request.Notes?.Trim(),
            CuredDate = request.CuredDate,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        _db.IllnessRecords.Add(entity);
        await _db.SaveChangesAsync();

        return Ok(new { entity.Id });
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(long id, [FromBody] UpdateIllnessRecordRequest request)
    {
        var me = User.GetUserId();
        var entity = await _db.IllnessRecords.Include(i => i.Pet).FirstOrDefaultAsync(i => i.Id == id);
        if (entity is null) return NotFound();
        if (entity.Pet.UserId != me) return Forbid();

        entity.IllnessName = request.IllnessName.Trim();
        entity.DiagnosisDate = request.DiagnosisDate;
        entity.Status = request.Status;
        entity.Description = request.Description?.Trim();
        entity.Notes = request.Notes?.Trim();
        entity.CuredDate = request.CuredDate;
        entity.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new { message = "Illness record updated." });
    }

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id)
    {
        var me = User.GetUserId();
        var entity = await _db.IllnessRecords.Include(i => i.Pet).FirstOrDefaultAsync(i => i.Id == id);
        if (entity is null) return NotFound();
        if (entity.Pet.UserId != me) return Forbid();

        _db.IllnessRecords.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("ongoing")]
    public async Task<IActionResult> Ongoing()
    {
        var me = User.GetUserId();
        var items = await _db.IllnessRecords
            .Where(i => i.Pet.UserId == me && i.Status == IllnessStatus.Ongoing)
            .OrderByDescending(i => i.DiagnosisDate)
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
                i.Medications.Select(m => m.Id).ToList()))
            .ToListAsync();

        return Ok(items);
    }
}
