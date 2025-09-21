// File: Controllers/MetaController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetCare.Api.Data;

namespace PetCare.Api.Controllers;

[ApiController]
[Route("api/meta")]
public class MetaController : ControllerBase
{
    private readonly AppDbContext _db;
    public MetaController(AppDbContext db) => _db = db;

    [HttpGet("species")]
    public async Task<IActionResult> Species()
    {
        var items = await _db.Species
            .OrderBy(s => s.Name)
            .Select(s => new { s.Id, s.Code, s.Name })
            .ToListAsync();
        return Ok(items);
    }

    [HttpGet("breeds")]
    public async Task<IActionResult> Breeds([FromQuery] int speciesId)
    {
        var items = await _db.Breeds
            .Where(b => b.SpeciesId == speciesId)
            .OrderBy(b => b.Name)
            .Select(b => new { b.Id, b.SpeciesId, b.Name })
            .ToListAsync();
        return Ok(items);
    }
}
