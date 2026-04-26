using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetCare.Api.Data;
using PetCare.Api.DTOs;
using PetCare.Api.Model;
using PetCare.Api.Security;
using PetCare.Api.Services;
using System.Security.Claims;

namespace PetCare.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlacesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AdminAuditLogger _auditLogger;
    private readonly IWebHostEnvironment _env;

    public PlacesController(AppDbContext db, AdminAuditLogger auditLogger, IWebHostEnvironment env)
    {
        _db = db;
        _auditLogger = auditLogger;
        _env = env;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll([FromQuery] PlaceType? type)
    {
        var query = _db.PetPlaces
            .AsNoTracking()
            .AsQueryable();

        if (type.HasValue) query = query.Where(p => p.Type == type.Value);

        var items = await ProjectToPlaceResponse(query
            .OrderBy(p => p.Name)
            .ThenBy(p => p.Id))
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(Guid id)
    {
        var item = await ProjectToPlaceResponse(_db.PetPlaces
            .AsNoTracking()
            .Where(p => p.Id == id))
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

        var items = await ProjectToPlaceResponse(_db.PetPlaces
            .AsNoTracking()
            .Where(p => p.Latitude.HasValue && p.Longitude.HasValue)
            .Where(p => p.Latitude >= latMin && p.Latitude <= latMax && p.Longitude >= lonMin && p.Longitude <= lonMax)
            .OrderBy(p => p.Name)
            .ThenBy(p => p.Id))
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("mine")]
    [Authorize(Policy = AuthConstants.Policies.UserOnly)]
    public async Task<IActionResult> GetMine()
    {
        var userId = User.GetUserId();
        var items = await ProjectToPlaceResponse(_db.PetPlaces
            .AsNoTracking()
            .Where(p => p.OwnerUserId == userId)
            .OrderBy(p => p.Name)
            .ThenBy(p => p.Id))
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] CreatePlaceRequest request)
    {
        var access = await ResolvePlaceWriteAccessAsync();
        if (access is null)
        {
            return Forbid();
        }

        var placeId = Guid.NewGuid();
        var entity = new PetPlaceModel
        {
            Id = placeId,
            OwnerUserId = access.UserId,
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
            CreatedAt = DateTimeOffset.UtcNow,
            Schedules = ToScheduleModels(placeId, request.Schedule)
        };

        _db.PetPlaces.Add(entity);
        if (access.AdminUserId.HasValue)
        {
            _auditLogger.Log(
                access.AdminUserId.Value,
                "CreatePlace",
                "Place",
                entity.Id.ToString(),
                $"Created place '{entity.Name}' with type '{entity.Type}'."
            );
        }
        await _db.SaveChangesAsync();

        var response = await ProjectToPlaceResponse(_db.PetPlaces
            .AsNoTracking()
            .Where(p => p.Id == entity.Id))
            .FirstAsync();

        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, response);
    }

    [HttpPut("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePlaceRequest request)
    {
        var access = await ResolvePlaceWriteAccessAsync();
        if (access is null)
        {
            return Forbid();
        }

        var entity = await _db.PetPlaces
            .Include(p => p.Schedules)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (entity is null) return NotFound();
        if (!CanManagePlace(access, entity))
        {
            return Forbid();
        }

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
        var newSchedules = ToScheduleModels(entity.Id, request.Schedule);
        _db.PetPlaceSchedules.RemoveRange(entity.Schedules);
        entity.Schedules = newSchedules;
        _db.PetPlaceSchedules.AddRange(newSchedules);
        if (access.AdminUserId.HasValue)
        {
            _auditLogger.Log(
                access.AdminUserId.Value,
                "UpdatePlace",
                "Place",
                entity.Id.ToString(),
                $"Updated place '{entity.Name}' with type '{entity.Type}'."
            );
        }

        await _db.SaveChangesAsync();
        var response = await ProjectToPlaceResponse(_db.PetPlaces
            .AsNoTracking()
            .Where(p => p.Id == entity.Id))
            .FirstAsync();

        return Ok(response);
    }

    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> Delete(Guid id)
    {
        var access = await ResolvePlaceWriteAccessAsync();
        if (access is null)
        {
            return Forbid();
        }

        var entity = await _db.PetPlaces
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (entity is null) return NotFound();
        if (!CanManagePlace(access, entity))
        {
            return Forbid();
        }

        var usedByConsultations = await _db.Consultations.AnyAsync(c => c.VetPlaceId == id);
        if (usedByConsultations) return Conflict(new { message = "Cannot delete a place referenced by consultations." });

        foreach (var image in entity.Images)
        {
            LocalImageStorage.TryDeleteFile(_env, image.Url);
        }

        _db.PetPlaces.Remove(entity);
        if (access.AdminUserId.HasValue)
        {
            _auditLogger.Log(
                access.AdminUserId.Value,
                "DeletePlace",
                "Place",
                entity.Id.ToString(),
                $"Deleted place '{entity.Name}' with type '{entity.Type}'."
            );
        }
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:guid}/images")]
    [Authorize]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(ImageCollectionUploadRules.MaxUploadRequestBytes)]
    public async Task<IActionResult> UploadImages(Guid id, [FromForm] UploadImageFilesRequest request)
    {
        var access = await ResolvePlaceWriteAccessAsync();
        if (access is null)
        {
            return Forbid();
        }

        var place = await _db.PetPlaces
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (place is null)
        {
            return NotFound();
        }

        if (!CanManagePlace(access, place))
        {
            return Forbid();
        }

        if (!ImageCollectionUploadRules.TryValidate(request.Files, place.Images.Count, out var errorMessage))
        {
            return BadRequest(new { message = errorMessage });
        }

        var createdImages = new List<PetPlaceImageModel>(request.Files.Count);
        foreach (var file in request.Files)
        {
            ImageUploadValidator.TryValidateImage(file, out _, out var normalizedExtension);
            var imageUrl = await LocalImageStorage.SaveImageAsync(
                _env,
                file,
                "place",
                normalizedExtension,
                "places",
                place.Id.ToString("N"));

            createdImages.Add(new PetPlaceImageModel
            {
                PetPlaceId = place.Id,
                Url = imageUrl,
                CreatedAt = DateTimeOffset.UtcNow
            });
        }

        _db.PetPlaceImages.AddRange(createdImages);
        if (string.IsNullOrWhiteSpace(place.Photo) && createdImages.Count > 0)
        {
            place.Photo = createdImages[0].Url;
        }

        if (access.AdminUserId.HasValue)
        {
            _auditLogger.Log(
                access.AdminUserId.Value,
                "UploadPlaceImages",
                "Place",
                place.Id.ToString(),
                $"Uploaded {createdImages.Count} image(s) for place '{place.Name}'."
            );
        }

        await _db.SaveChangesAsync();
        return Ok(createdImages
            .OrderBy(i => i.CreatedAt)
            .ThenBy(i => i.Id)
            .Select(ToPlaceImageResponse)
            .ToList());
    }

    [HttpDelete("{id:guid}/images/{imageId:long}")]
    [Authorize]
    public async Task<IActionResult> DeleteImage(Guid id, long imageId)
    {
        var access = await ResolvePlaceWriteAccessAsync();
        if (access is null)
        {
            return Forbid();
        }

        var place = await _db.PetPlaces
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (place is null)
        {
            return NotFound();
        }

        if (!CanManagePlace(access, place))
        {
            return Forbid();
        }

        var image = place.Images.FirstOrDefault(i => i.Id == imageId);
        if (image is null)
        {
            return NotFound(new { message = "Place image not found." });
        }

        _db.PetPlaceImages.Remove(image);
        LocalImageStorage.TryDeleteFile(_env, image.Url);

        if (string.Equals(place.Photo, image.Url, StringComparison.Ordinal))
        {
            place.Photo = place.Images
                .Where(i => i.Id != image.Id)
                .OrderBy(i => i.CreatedAt)
                .ThenBy(i => i.Id)
                .Select(i => i.Url)
                .FirstOrDefault();
        }

        if (access.AdminUserId.HasValue)
        {
            _auditLogger.Log(
                access.AdminUserId.Value,
                "DeletePlaceImage",
                "Place",
                place.Id.ToString(),
                $"Deleted image '{image.Id}' from place '{place.Name}'."
            );
        }

        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static List<PetPlaceScheduleModel> ToScheduleModels(Guid petPlaceId, IReadOnlyList<PlaceScheduleRequest> schedule) =>
        schedule
            .Select(item => new PetPlaceScheduleModel
            {
                PetPlaceId = petPlaceId,
                DayOfWeek = item.DayOfWeek,
                IsClosed = item.IsClosed,
                OpenTime = item.IsClosed ? null : item.OpenTime,
                CloseTime = item.IsClosed ? null : item.CloseTime,
                BreakStartTime = item.IsClosed ? null : item.BreakStartTime,
                BreakEndTime = item.IsClosed ? null : item.BreakEndTime
            })
            .ToList();

    private async Task<PlaceWriteAccess?> ResolvePlaceWriteAccessAsync()
    {
        var actorType = User.FindFirstValue(AuthConstants.Claims.ActorType);
        if (string.Equals(actorType, AuthConstants.ActorTypes.Admin, StringComparison.Ordinal))
        {
            var rawAdminId = User.FindFirstValue(AuthConstants.Claims.AdminId)
                ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub");
            if (!long.TryParse(rawAdminId, out var adminId))
            {
                return null;
            }

            var admin = await _db.AdminUsers
                .AsNoTracking()
                .FirstOrDefaultAsync(a =>
                    a.Id == adminId &&
                    a.IsActive &&
                    (a.Role == AdminRole.Admin || a.Role == AdminRole.Manager));

            return admin is null ? null : new PlaceWriteAccess(null, admin.Id);
        }

        if (!string.Equals(actorType, AuthConstants.ActorTypes.User, StringComparison.Ordinal))
        {
            return null;
        }

        var rawUserId = User.FindFirstValue(AuthConstants.Claims.UserId)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");
        if (!long.TryParse(rawUserId, out var userId))
        {
            return null;
        }

        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId && !u.IsBanned && u.IsApprovedPlaceOwner);

        return user is null ? null : new PlaceWriteAccess(user.Id, null);
    }

    private static bool CanManagePlace(PlaceWriteAccess access, PetPlaceModel place) =>
        access.AdminUserId.HasValue || (access.UserId.HasValue && place.OwnerUserId == access.UserId.Value);

    private static IQueryable<PlaceResponse> ProjectToPlaceResponse(IQueryable<PetPlaceModel> query) =>
        query.Select(place => new PlaceResponse(
            place.Id,
            place.OwnerUserId,
            place.Name,
            place.Phone,
            place.Email,
            place.Photo,
            place.Description,
            place.AddressLine1,
            place.AddressLine2,
            place.City,
            place.Country,
            place.Status,
            place.Type,
            place.Latitude,
            place.Longitude,
            place.CreatedAt,
            place.Images
                .OrderBy(i => i.CreatedAt)
                .ThenBy(i => i.Id)
                .Select(i => new PlaceImageResponse(
                    i.Id,
                    i.Url,
                    i.CreatedAt
                ))
                .ToList(),
            place.Schedules
                .OrderBy(s => s.DayOfWeek)
                .Select(s => new PlaceScheduleResponse(
                    s.Id,
                    s.DayOfWeek,
                    s.IsClosed,
                    s.OpenTime,
                    s.CloseTime,
                    s.BreakStartTime,
                    s.BreakEndTime
                ))
                .ToList(),
            place.Reviews.Average(r => (double?)r.Rating),
            place.Reviews.Count()
        ));

    private static PlaceImageResponse ToPlaceImageResponse(PetPlaceImageModel image) =>
        new(image.Id, image.Url, image.CreatedAt);

    private sealed record PlaceWriteAccess(long? UserId, long? AdminUserId);
}
