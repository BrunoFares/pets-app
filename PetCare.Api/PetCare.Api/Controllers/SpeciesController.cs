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
public class SpeciesController : ControllerBase
{
    private readonly AppDbContext _db;

    public SpeciesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var items = await _db.Species
            .Include(s => s.Breeds)
            .OrderBy(s => s.Name)
            .Select(s => new SpeciesResponse(
                s.Id,
                s.Code,
                s.Name,
                s.Breeds.OrderBy(b => b.Name).Select(b => new BreedSummaryResponse(b.Id, b.SpeciesId, b.Name)).ToList()
            ))
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _db.Species
            .Include(s => s.Breeds)
            .Where(s => s.Id == id)
            .Select(s => new SpeciesResponse(
                s.Id,
                s.Code,
                s.Name,
                s.Breeds.OrderBy(b => b.Name).Select(b => new BreedSummaryResponse(b.Id, b.SpeciesId, b.Name)).ToList()
            ))
            .FirstOrDefaultAsync();

        return item is null ? NotFound() : Ok(item);
    }

    [Authorize(Policy = AuthConstants.Policies.AdminOnly)]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSpeciesRequest request)
    {
        var code = request.Code.Trim().ToLowerInvariant();
        var name = request.Name.Trim();

        if (await _db.Species.AnyAsync(s => s.Code == code))
            return Conflict(new { message = "Species code already exists." });

        if (await _db.Species.AnyAsync(s => s.Name == name))
            return Conflict(new { message = "Species name already exists." });

        var item = new SpeciesModel { Code = code, Name = name };
        _db.Species.Add(item);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
    }

    [Authorize(Policy = AuthConstants.Policies.AdminOnly)]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateSpeciesRequest request)
    {
        var item = await _db.Species.FindAsync(id);
        if (item is null) return NotFound();

        var code = request.Code.Trim().ToLowerInvariant();
        var name = request.Name.Trim();

        var duplicateCode = await _db.Species.AnyAsync(s => s.Code == code && s.Id != id);
        if (duplicateCode) return Conflict(new { message = "Species code already exists." });

        var duplicateName = await _db.Species.AnyAsync(s => s.Name == name && s.Id != id);
        if (duplicateName) return Conflict(new { message = "Species name already exists." });

        item.Code = code;
        item.Name = name;
        await _db.SaveChangesAsync();

        return Ok(item);
    }

    [Authorize(Policy = AuthConstants.Policies.AdminOnly)]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await _db.Species.FindAsync(id);
        if (item is null) return NotFound();

        var hasPets = await _db.Pets.AnyAsync(p => p.SpeciesId == id);
        if (hasPets) return Conflict(new { message = "Cannot delete species that is used by pets." });

        _db.Species.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
