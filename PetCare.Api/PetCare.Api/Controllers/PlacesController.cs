using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetCare.Api.Data;
using PetCare.Api.DTOs;
using PetCare.Api.Model;

namespace PetCare.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlacesController : ControllerBase
{
    private readonly AppDbContext _db;

    public PlacesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll([FromQuery] PlaceType? type)
    {
        var query = _db.PetPlaces.AsQueryable();
        if (type.HasValue) query = query.Where(p => p.Type == type.Value);

        var items = await query
            .OrderBy(p => p.Name)
            .Select(p => new PlaceResponse(
                p.Id,
                p.Name,
                p.Phone,
                p.Email,
                p.Photo,
                p.Description,
                p.AddressLine1,
                p.AddressLine2,
                p.City,
                p.Country,
                p.Status,
                p.Type,
                p.Latitude,
                p.Longitude,
                p.CreatedAt
            ))
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(Guid id)
    {
        var item = await _db.PetPlaces
            .Where(p => p.Id == id)
            .Select(p => new PlaceResponse(
                p.Id,
                p.Name,
                p.Phone,
                p.Email,
                p.Photo,
                p.Description,
                p.AddressLine1,
                p.AddressLine2,
                p.City,
                p.Country,
                p.Status,
                p.Type,
                p.Latitude,
                p.Longitude,
                p.CreatedAt
            ))
            .FirstOrDefaultAsync();

        return item is null ? NotFound() : Ok(item);
    }

    [HttpGet("vets")]
    [AllowAnonymous]
    public Task<IActionResult> GetVets() => GetAll(PlaceType.Vet);

    [HttpGet("pet-shops")]
    [AllowAnonymous]
    public Task<IActionResult> GetPetShops() => GetAll(PlaceType.PetShop);

    [HttpGet("nearby")]
    [AllowAnonymous]
    public async Task<IActionResult> Nearby([FromQuery] decimal lat, [FromQuery] decimal lon, [FromQuery] decimal radiusKm = 10)
    {
        if (radiusKm <= 0 || radiusKm > 200) return BadRequest(new { message = "radiusKm must be between 0 and 200." });

        var latMin = lat - (radiusKm / 111m);
        var latMax = lat + (radiusKm / 111m);
        var lonMin = lon - (radiusKm / 111m);
        var lonMax = lon + (radiusKm / 111m);

        var items = await _db.PetPlaces
            .Where(p => p.Latitude.HasValue && p.Longitude.HasValue)
            .Where(p => p.Latitude >= latMin && p.Latitude <= latMax && p.Longitude >= lonMin && p.Longitude <= lonMax)
            .Select(p => new PlaceResponse(
                p.Id,
                p.Name,
                p.Phone,
                p.Email,
                p.Photo,
                p.Description,
                p.AddressLine1,
                p.AddressLine2,
                p.City,
                p.Country,
                p.Status,
                p.Type,
                p.Latitude,
                p.Longitude,
                p.CreatedAt
            ))
            .ToListAsync();

        return Ok(items);
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePlaceRequest request)
    {
        var entity = new PetPlaceModel
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Phone = request.Phone.Trim(),
            Email = request.Email.Trim().ToLowerInvariant(),
            Photo = request.Photo?.Trim(),
            Description = request.Description?.Trim(),
            AddressLine1 = request.AddressLine1.Trim(),
            AddressLine2 = request.AddressLine2?.Trim(),
            City = request.City.Trim(),
            Country = request.Country.Trim(),
            Status = request.Status,
            Type = request.Type,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.PetPlaces.Add(entity);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, new { entity.Id });
    }

    [Authorize]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePlaceRequest request)
    {
        var entity = await _db.PetPlaces.FindAsync(id);
        if (entity is null) return NotFound();

        entity.Name = request.Name.Trim();
        entity.Phone = request.Phone.Trim();
        entity.Email = request.Email.Trim().ToLowerInvariant();
        entity.Photo = request.Photo?.Trim();
        entity.Description = request.Description?.Trim();
        entity.AddressLine1 = request.AddressLine1.Trim();
        entity.AddressLine2 = request.AddressLine2?.Trim();
        entity.City = request.City.Trim();
        entity.Country = request.Country.Trim();
        entity.Status = request.Status;
        entity.Type = request.Type;
        entity.Latitude = request.Latitude;
        entity.Longitude = request.Longitude;

        await _db.SaveChangesAsync();
        return Ok(new { message = "Place updated." });
    }

    [Authorize]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var entity = await _db.PetPlaces.FindAsync(id);
        if (entity is null) return NotFound();

        var usedByConsultations = await _db.Consultations.AnyAsync(c => c.VetPlaceId == id);
        if (usedByConsultations) return Conflict(new { message = "Cannot delete a place referenced by consultations." });

        _db.PetPlaces.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
