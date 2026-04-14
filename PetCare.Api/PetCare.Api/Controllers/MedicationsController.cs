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
public class MedicationsController : ControllerBase
{
    private readonly AppDbContext _db;

    public MedicationsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("illness/{illnessId:long}")]
    public async Task<IActionResult> GetByIllness(long illnessId)
    {
        var me = User.GetUserId();
        var illness = await _db.IllnessRecords.Include(i => i.Pet).FirstOrDefaultAsync(i => i.Id == illnessId);
        if (illness is null) return NotFound();
        if (illness.Pet.UserId != me) return Forbid();

        var items = await _db.MedicationRecords
            .Where(m => m.IllnessId == illnessId)
            .OrderByDescending(m => m.CreatedAt)
            .Select(m => new MedicationRecordResponse(m.Id, m.IllnessId, m.MedicationName, m.Dosage, m.Instructions, m.StartDate, m.EndDate, m.FrequencyInDays, m.Times, m.ReminderEnabled, m.IsActive, m.CreatedAt, m.UpdatedAt))
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateMedicationRecordRequest request)
    {
        var me = User.GetUserId();
        var illness = await _db.IllnessRecords.Include(i => i.Pet).FirstOrDefaultAsync(i => i.Id == request.IllnessId);
        if (illness is null) return NotFound(new { message = "Illness not found." });
        if (illness.Pet.UserId != me) return Forbid();

        var entity = new MedicationRecordModel
        {
            IllnessId = request.IllnessId,
            MedicationName = request.MedicationName.Trim(),
            Dosage = request.Dosage?.Trim(),
            Instructions = request.Instructions?.Trim(),
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            FrequencyInDays = request.FrequencyInDays,
            Times = (request.Times ?? new List<string>()).Where(t => !string.IsNullOrWhiteSpace(t)).Select(t => t.Trim()).ToList(),
            ReminderEnabled = request.ReminderEnabled,
            IsActive = request.IsActive,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        _db.MedicationRecords.Add(entity);
        await _db.SaveChangesAsync();

        return Ok(new { entity.Id });
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(long id, [FromBody] UpdateMedicationRecordRequest request)
    {
        var me = User.GetUserId();
        var entity = await _db.MedicationRecords
            .Include(m => m.Illness)
            .ThenInclude(i => i.Pet)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (entity is null) return NotFound();
        if (entity.Illness.Pet.UserId != me) return Forbid();

        entity.MedicationName = request.MedicationName.Trim();
        entity.Dosage = request.Dosage?.Trim();
        entity.Instructions = request.Instructions?.Trim();
        entity.StartDate = request.StartDate;
        entity.EndDate = request.EndDate;
        entity.FrequencyInDays = request.FrequencyInDays;
        entity.Times = (request.Times ?? new List<string>()).Where(t => !string.IsNullOrWhiteSpace(t)).Select(t => t.Trim()).ToList();
        entity.ReminderEnabled = request.ReminderEnabled;
        entity.IsActive = request.IsActive;
        entity.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new { message = "Medication record updated." });
    }

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id)
    {
        var me = User.GetUserId();
        var entity = await _db.MedicationRecords
            .Include(m => m.Illness)
            .ThenInclude(i => i.Pet)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (entity is null) return NotFound();
        if (entity.Illness.Pet.UserId != me) return Forbid();

        _db.MedicationRecords.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("active")]
    public async Task<IActionResult> GetActive()
    {
        var me = User.GetUserId();
        var items = await _db.MedicationRecords
            .Where(m => m.Illness.Pet.UserId == me && m.IsActive)
            .OrderBy(m => m.StartDate)
            .Select(m => new MedicationRecordResponse(m.Id, m.IllnessId, m.MedicationName, m.Dosage, m.Instructions, m.StartDate, m.EndDate, m.FrequencyInDays, m.Times, m.ReminderEnabled, m.IsActive, m.CreatedAt, m.UpdatedAt))
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("needs-reminders")]
    public async Task<IActionResult> NeedsReminders()
    {
        var me = User.GetUserId();
        var now = DateTimeOffset.UtcNow;

        var items = await _db.MedicationRecords
            .Where(m => m.Illness.Pet.UserId == me && m.ReminderEnabled && m.IsActive && (m.EndDate == null || m.EndDate >= now))
            .OrderBy(m => m.StartDate)
            .Select(m => new MedicationRecordResponse(m.Id, m.IllnessId, m.MedicationName, m.Dosage, m.Instructions, m.StartDate, m.EndDate, m.FrequencyInDays, m.Times, m.ReminderEnabled, m.IsActive, m.CreatedAt, m.UpdatedAt))
            .ToListAsync();

        return Ok(items);
    }
}
