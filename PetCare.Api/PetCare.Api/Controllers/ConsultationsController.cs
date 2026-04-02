using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetCare.Api.Data;
using PetCare.Api.DTOs;
using PetCare.Api.Model;
using System.Security.Claims;

namespace PetCare.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ConsultationsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ConsultationsController(AppDbContext context)
    {
        _context = context;
    }

    private long Me() =>
        long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!);

    private Task<bool> PetBelongsToUser(Guid petId, long userId)
    {
        return _context.Pets.AnyAsync(p => p.Id == petId && p.UserId == userId);
    }

    // Create a new consultation
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateConsultationRequest req)
    {
        if (!await PetBelongsToUser(req.PetId, Me()))
            return Forbid();

        var consultation = new ConsultationModel
        {
            UserId = Me(),
            PetId = req.PetId,
            VetId = req.VetId.Trim(),
            Date = req.Date,
            Details = req.Details.Trim(),
            CreatedAt = DateTimeOffset.UtcNow
        };

        _context.Consultations.Add(consultation);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            Id = consultation.Id.ToString(),
            PetId = consultation.PetId.ToString(),
            VetId = consultation.VetId,
            Date = consultation.Date,
            Details = consultation.Details
        });
    }

    // Get all consultations for a user
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var consultations = await _context.Consultations
            .Where(c => c.UserId == Me())
            .OrderByDescending(c => c.Date)
            .Select(c => new
            {
                Id = c.Id.ToString(),
                PetId = c.PetId.ToString(),
                VetId = c.VetId,
                Date = c.Date,
                Details = c.Details
            })
            .ToListAsync();

        return Ok(consultations);
    }

    // Get all consultations for a specific pet
    [HttpGet("pet/{petId:guid}")]
    public async Task<IActionResult> GetByPet(Guid petId)
    {
        if (!await PetBelongsToUser(petId, Me()))
            return Forbid();

        var consultations = await _context.Consultations
            .Where(c => c.PetId == petId)
            .OrderByDescending(c => c.Date)
            .Select(c => new
            {
                Id = c.Id.ToString(),
                PetId = c.PetId.ToString(),
                VetId = c.VetId,
                Date = c.Date,
                Details = c.Details
            })
            .ToListAsync();

        return Ok(consultations);
    }

    // Edit a consultation
    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(long id, [FromBody] UpdateConsultationRequest req)
    {
        var consultation = await _context.Consultations.FirstOrDefaultAsync(c => c.Id == id);
        if (consultation == null) return NotFound();

        if (consultation.UserId != Me())
            return Forbid();

        consultation.VetId = req.VetId.Trim();
        consultation.Date = req.Date;
        consultation.Details = req.Details.Trim();
        consultation.UpdatedAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            Id = consultation.Id.ToString(),
            PetId = consultation.PetId.ToString(),
            VetId = consultation.VetId,
            Date = consultation.Date,
            Details = consultation.Details
        });
    }

    // Delete a consultation
    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id)
    {
        var consultation = await _context.Consultations.FirstOrDefaultAsync(c => c.Id == id);
        if (consultation == null) return NotFound();

        if (consultation.UserId != Me())
            return Forbid();

        _context.Consultations.Remove(consultation);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Consultation deleted" });
    }
}