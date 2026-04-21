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
public class ConsultationsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ConsultationsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllForCurrentUserPets()
    {
        var me = User.GetUserId();
        var consultations = await _db.Consultations
            .Where(c => c.UserId == me)
            .OrderByDescending(c => c.Date)
            .Select(c => new ConsultationResponse(
                c.Id,
                c.PetId,
                c.VetPlaceId,
                c.VetPlace != null ? c.VetPlace.Name : null,
                c.Date,
                c.Details,
                c.CreatedAt,
                c.UpdatedAt
            ))
            .ToListAsync();

        return Ok(consultations);
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var me = User.GetUserId();
        var consultation = await _db.Consultations
            .Where(c => c.Id == id && c.UserId == me)
            .Select(c => new ConsultationResponse(
                c.Id,
                c.PetId,
                c.VetPlaceId,
                c.VetPlace != null ? c.VetPlace.Name : null,
                c.Date,
                c.Details,
                c.CreatedAt,
                c.UpdatedAt
            ))
            .FirstOrDefaultAsync();

        return consultation is null ? NotFound() : Ok(consultation);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateConsultationRequest request)
    {
        var me = User.GetUserId();
        var petBelongsToUser = await _db.Pets.AnyAsync(p => p.Id == request.PetId && p.UserId == me);
        if (!petBelongsToUser) return Forbid();

        if (request.VetPlaceId is Guid vetId)
        {
            var vetExists = await _db.PetPlaces.AnyAsync(p => p.Id == vetId && p.Type == PlaceType.Vet);
            if (!vetExists) return BadRequest(new { message = "Vet place not found." });
        }

        var consultation = new ConsultationModel
        {
            UserId = me,
            PetId = request.PetId,
            VetPlaceId = request.VetPlaceId,
            Date = request.Date,
            Details = request.Details.Trim(),
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.Consultations.Add(consultation);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = consultation.Id }, new { consultation.Id });
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(long id, [FromBody] UpdateConsultationRequest request)
    {
        var me = User.GetUserId();
        var consultation = await _db.Consultations.FirstOrDefaultAsync(c => c.Id == id && c.UserId == me);
        if (consultation == null) return NotFound();

        if (request.VetPlaceId is Guid vetId)
        {
            var vetExists = await _db.PetPlaces.AnyAsync(p => p.Id == vetId && p.Type == PlaceType.Vet);
            if (!vetExists) return BadRequest(new { message = "Vet place not found." });
        }

        consultation.VetPlaceId = request.VetPlaceId;
        consultation.Date = request.Date;
        consultation.Details = request.Details.Trim();
        consultation.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new { message = "Consultation updated." });
    }

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id)
    {
        var me = User.GetUserId();
        var consultation = await _db.Consultations.FirstOrDefaultAsync(c => c.Id == id && c.UserId == me);
        if (consultation == null) return NotFound();

        _db.Consultations.Remove(consultation);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("upcoming")]
    public async Task<IActionResult> Upcoming([FromQuery] int days = 14)
    {
        var me = User.GetUserId();
        if (days < 1 || days > 365) return BadRequest(new { message = "days must be between 1 and 365." });

        var now = DateTimeOffset.UtcNow;
        var until = now.AddDays(days);

        var consultations = await _db.Consultations
            .Where(c => c.UserId == me && c.Date >= now && c.Date <= until)
            .OrderBy(c => c.Date)
            .Select(c => new ConsultationResponse(
                c.Id,
                c.PetId,
                c.VetPlaceId,
                c.VetPlace != null ? c.VetPlace.Name : null,
                c.Date,
                c.Details,
                c.CreatedAt,
                c.UpdatedAt
            ))
            .ToListAsync();

        return Ok(consultations);
    }
}
