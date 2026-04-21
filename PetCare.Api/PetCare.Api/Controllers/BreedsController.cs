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
public class BreedsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AdminAuditLogger _auditLogger;

    public BreedsController(AppDbContext db, AdminAuditLogger auditLogger)
    {
        _db = db;
        _auditLogger = auditLogger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? speciesId)
    {
        var query = _db.Breeds.Include(b => b.Species).AsQueryable();
        if (speciesId is int sid) query = query.Where(b => b.SpeciesId == sid);

        var items = await query
            .OrderBy(b => b.Name)
            .Select(b => new BreedResponse(b.Id, b.SpeciesId, b.Species.Name, b.Name))
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _db.Breeds
            .Include(b => b.Species)
            .Where(b => b.Id == id)
            .Select(b => new BreedResponse(b.Id, b.SpeciesId, b.Species.Name, b.Name))
            .FirstOrDefaultAsync();

        return item is null ? NotFound() : Ok(item);
    }

    [Authorize(Policy = AuthConstants.Policies.AdminOnly)]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBreedRequest request)
    {
        var adminUserId = User.GetAdminId();
        var speciesExists = await _db.Species.AnyAsync(s => s.Id == request.SpeciesId);
        if (!speciesExists) return BadRequest(new { message = "Invalid species." });

        var name = request.Name.Trim();
        var duplicate = await _db.Breeds.AnyAsync(b => b.SpeciesId == request.SpeciesId && b.Name == name);
        if (duplicate) return Conflict(new { message = "Breed already exists for this species." });

        var item = new BreedModel { SpeciesId = request.SpeciesId, Name = name };
        _db.Breeds.Add(item);
        await _db.SaveChangesAsync();

        _auditLogger.Log(
            adminUserId,
            "CreateBreed",
            "Breed",
            item.Id.ToString(),
            $"Created breed '{item.Name}' for species '{item.SpeciesId}'."
        );
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
    }

    [Authorize(Policy = AuthConstants.Policies.AdminOnly)]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateBreedRequest request)
    {
        var adminUserId = User.GetAdminId();
        var item = await _db.Breeds.FindAsync(id);
        if (item is null) return NotFound();

        var speciesExists = await _db.Species.AnyAsync(s => s.Id == request.SpeciesId);
        if (!speciesExists) return BadRequest(new { message = "Invalid species." });

        var name = request.Name.Trim();
        var duplicate = await _db.Breeds.AnyAsync(b => b.SpeciesId == request.SpeciesId && b.Name == name && b.Id != id);
        if (duplicate) return Conflict(new { message = "Breed already exists for this species." });

        item.SpeciesId = request.SpeciesId;
        item.Name = name;
        _auditLogger.Log(
            adminUserId,
            "UpdateBreed",
            "Breed",
            item.Id.ToString(),
            $"Updated breed '{item.Name}' for species '{item.SpeciesId}'."
        );
        await _db.SaveChangesAsync();

        return Ok(item);
    }

    [Authorize(Policy = AuthConstants.Policies.AdminOnly)]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var adminUserId = User.GetAdminId();
        var item = await _db.Breeds.FindAsync(id);
        if (item is null) return NotFound();

        var hasPets = await _db.Pets.AnyAsync(p => p.BreedId == id);
        if (hasPets) return Conflict(new { message = "Cannot delete breed that is used by pets." });

        _db.Breeds.Remove(item);
        _auditLogger.Log(
            adminUserId,
            "DeleteBreed",
            "Breed",
            item.Id.ToString(),
            $"Deleted breed '{item.Name}' from species '{item.SpeciesId}'."
        );
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
