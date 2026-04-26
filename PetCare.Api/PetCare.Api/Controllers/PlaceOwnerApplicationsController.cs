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
[Route("api/place-owner-applications")]
[Authorize(Policy = AuthConstants.Policies.UserOnly)]
public class PlaceOwnerApplicationsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;

    public PlaceOwnerApplicationsController(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePlaceOwnerApplicationRequest request)
    {
        var userId = User.GetUserId();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null)
        {
            return NotFound(new { message = "User not found." });
        }

        if (user.IsApprovedPlaceOwner)
        {
            return Conflict(new { message = "You are already an approved place owner." });
        }

        var hasPendingApplication = await _db.PlaceOwnerApplications
            .AsNoTracking()
            .AnyAsync(a => a.UserId == userId && a.Status == PlaceOwnerApplicationStatus.Pending);

        if (hasPendingApplication)
        {
            return Conflict(new { message = "You already have a pending place owner application." });
        }

        var application = new PlaceOwnerApplicationModel
        {
            UserId = userId,
            BusinessName = request.BusinessName.Trim(),
            Phone = request.Phone.Trim(),
            Email = request.Email.Trim().ToLowerInvariant(),
            Description = NormalizeText(request.Description),
            AddressLine1 = request.AddressLine1.Trim(),
            AddressLine2 = NormalizeText(request.AddressLine2),
            City = request.City.Trim(),
            Country = request.Country.Trim(),
            RequestedPlaceType = request.RequestedPlaceType,
            Status = PlaceOwnerApplicationStatus.Pending,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        _db.PlaceOwnerApplications.Add(application);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            var pendingStillExists = await _db.PlaceOwnerApplications
                .AsNoTracking()
                .AnyAsync(a => a.UserId == userId && a.Status == PlaceOwnerApplicationStatus.Pending);

            if (pendingStillExists)
            {
                return Conflict(new { message = "You already have a pending place owner application." });
            }

            throw;
        }

        return StatusCode(StatusCodes.Status201Created, ToResponse(application));
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMyLatest()
    {
        var userId = User.GetUserId();
        var application = await ProjectToResponse(_db.PlaceOwnerApplications
            .AsNoTracking()
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.CreatedAt)
            .ThenByDescending(a => a.Id))
            .FirstOrDefaultAsync();

        return application is null ? NotFound() : Ok(ToResponse(application));
    }

    [HttpPost("me/images")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(ImageCollectionUploadRules.MaxUploadRequestBytes)]
    public async Task<IActionResult> UploadMyImages([FromForm] UploadImageFilesRequest request)
    {
        var application = await GetCurrentPendingApplicationAsync();
        if (application is null)
        {
            return NotFound(new { message = "No pending place owner application found." });
        }

        if (!ImageCollectionUploadRules.TryValidate(request.Files, application.Images.Count, out var errorMessage))
        {
            return BadRequest(new { message = errorMessage });
        }

        var createdImages = new List<PlaceOwnerApplicationImageModel>(request.Files.Count);
        foreach (var file in request.Files)
        {
            ImageUploadValidator.TryValidateImage(file, out _, out var normalizedExtension);
            var imageUrl = await LocalImageStorage.SaveImageAsync(
                _env,
                file,
                "application",
                normalizedExtension,
                "place-owner-applications",
                application.Id.ToString());

            createdImages.Add(new PlaceOwnerApplicationImageModel
            {
                PlaceOwnerApplicationId = application.Id,
                Url = imageUrl,
                CreatedAt = DateTimeOffset.UtcNow
            });
        }

        _db.PlaceOwnerApplicationImages.AddRange(createdImages);
        await _db.SaveChangesAsync();

        return Ok(createdImages
            .OrderBy(i => i.CreatedAt)
            .ThenBy(i => i.Id)
            .Select(ToImageResponse)
            .ToList());
    }

    [HttpDelete("me/images/{imageId:long}")]
    public async Task<IActionResult> DeleteMyImage(long imageId)
    {
        var application = await GetCurrentPendingApplicationAsync();
        if (application is null)
        {
            return NotFound(new { message = "No pending place owner application found." });
        }

        var image = application.Images.FirstOrDefault(i => i.Id == imageId);
        if (image is null)
        {
            return NotFound(new { message = "Application image not found." });
        }

        _db.PlaceOwnerApplicationImages.Remove(image);
        LocalImageStorage.TryDeleteFile(_env, image.Url);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    private static PlaceOwnerApplicationResponse ToResponse(PlaceOwnerApplicationModel application) =>
        new(
            application.Id,
            application.UserId,
            application.BusinessName,
            application.Phone,
            application.Email,
            application.Description,
            application.AddressLine1,
            application.AddressLine2,
            application.City,
            application.Country,
            application.RequestedPlaceType,
            application.Status,
            application.RejectionReason,
            application.AdminNotes,
            application.ReviewedByAdminId,
            application.ReviewedAt,
            application.CreatedAt,
            application.UpdatedAt,
            application.Images
                .OrderBy(i => i.CreatedAt)
                .ThenBy(i => i.Id)
                .Select(ToImageResponse)
                .ToList()
        );

    private static PlaceOwnerApplicationResponse ToResponse(PlaceOwnerApplicationResponse application) => application;

    private static IQueryable<PlaceOwnerApplicationResponse> ProjectToResponse(IQueryable<PlaceOwnerApplicationModel> query) =>
        query.Select(application => new PlaceOwnerApplicationResponse(
            application.Id,
            application.UserId,
            application.BusinessName,
            application.Phone,
            application.Email,
            application.Description,
            application.AddressLine1,
            application.AddressLine2,
            application.City,
            application.Country,
            application.RequestedPlaceType,
            application.Status,
            application.RejectionReason,
            application.AdminNotes,
            application.ReviewedByAdminId,
            application.ReviewedAt,
            application.CreatedAt,
            application.UpdatedAt,
            application.Images
                .OrderBy(i => i.CreatedAt)
                .ThenBy(i => i.Id)
                .Select(i => new PlaceOwnerApplicationImageResponse(
                    i.Id,
                    i.Url,
                    i.CreatedAt
                ))
                .ToList()
        ));

    private async Task<PlaceOwnerApplicationModel?> GetCurrentPendingApplicationAsync()
    {
        var userId = User.GetUserId();
        return await _db.PlaceOwnerApplications
            .Include(a => a.Images)
            .FirstOrDefaultAsync(a => a.UserId == userId && a.Status == PlaceOwnerApplicationStatus.Pending);
    }

    private static PlaceOwnerApplicationImageResponse ToImageResponse(PlaceOwnerApplicationImageModel image) =>
        new(image.Id, image.Url, image.CreatedAt);

    private static string? NormalizeText(string? value)
    {
        if (value is null)
        {
            return null;
        }

        var trimmed = value.Trim();
        return trimmed.Length == 0 ? null : trimmed;
    }
}
