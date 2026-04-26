using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetCare.Api.Data;
using PetCare.Api.DTOs;
using PetCare.Api.Model;
using PetCare.Api.Security;
using PetCare.Api.Services;

namespace PetCare.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = AuthConstants.Policies.UserOnly)]
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
            .AsNoTracking()
            .Where(m => m.IllnessId == illnessId)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync();

        return Ok(items.Select(ToResponse));
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
            Times = NormalizeTimesOrThrow(request.Times),
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
        entity.Times = NormalizeTimesOrThrow(request.Times);
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
        var now = DateTimeOffset.UtcNow;
        var items = await _db.MedicationRecords
            .AsNoTracking()
            .Where(m => m.Illness.Pet.UserId == me &&
                        m.IsActive &&
                        m.StartDate <= now &&
                        (m.EndDate == null || m.EndDate >= now))
            .OrderBy(m => m.StartDate)
            .ThenBy(m => m.MedicationName)
            .ToListAsync();

        return Ok(items.Select(ToResponse));
    }

    [HttpGet("needs-reminders")]
    public async Task<IActionResult> NeedsReminders()
    {
        var me = User.GetUserId();
        var now = DateTimeOffset.UtcNow;

        var candidates = await _db.MedicationRecords
            .AsNoTracking()
            .Where(m => m.Illness.Pet.UserId == me &&
                        m.ReminderEnabled &&
                        m.IsActive &&
                        m.StartDate <= now &&
                        (m.EndDate == null || m.EndDate >= now))
            .ToListAsync();

        var items = candidates
            .Select(m => new
            {
                Medication = m,
                NormalizedTimes = MedicationScheduleRules.TryNormalizeTimes(m.Times, out var normalizedTimes, out _)
                    ? normalizedTimes
                    : new List<string>()
            })
            .Where(x => x.NormalizedTimes.Count > 0 && MedicationScheduleRules.IsScheduledOnDate(x.Medication, now))
            .OrderBy(x => MedicationScheduleRules.GetFirstTimeOrMax(x.NormalizedTimes))
            .ThenBy(x => x.Medication.MedicationName)
            .Select(x => ToResponse(x.Medication, x.NormalizedTimes))
            .ToList();

        return Ok(items);
    }

    private static List<string> NormalizeTimesOrThrow(IReadOnlyList<string>? rawTimes)
    {
        if (MedicationScheduleRules.TryNormalizeTimes(rawTimes, out var normalizedTimes, out _))
        {
            return normalizedTimes;
        }

        throw new InvalidOperationException("Medication times were expected to be validated before saving.");
    }

    private static MedicationRecordResponse ToResponse(MedicationRecordModel medication)
    {
        return ToResponse(medication, MedicationScheduleRules.NormalizeTimesForResponse(medication.Times));
    }

    private static MedicationRecordResponse ToResponse(MedicationRecordModel medication, IReadOnlyList<string> normalizedTimes)
    {
        return new MedicationRecordResponse(
            medication.Id,
            medication.IllnessId,
            medication.MedicationName,
            medication.Dosage,
            medication.Instructions,
            medication.StartDate,
            medication.EndDate,
            medication.FrequencyInDays,
            normalizedTimes,
            medication.ReminderEnabled,
            medication.IsActive,
            medication.CreatedAt,
            medication.UpdatedAt
        );
    }
}
