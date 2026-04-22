using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetCare.Api.Data;
using PetCare.Api.DTOs;
using PetCare.Api.Model;
using PetCare.Api.Security;

namespace PetCare.Api.Controllers;

[ApiController]
[Route("api/place-owner-applications")]
[Authorize(Policy = AuthConstants.Policies.UserOnly)]
public class PlaceOwnerApplicationsController : ControllerBase
{
    private readonly AppDbContext _db;

    public PlaceOwnerApplicationsController(AppDbContext db)
    {
        _db = db;
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
        var application = await _db.PlaceOwnerApplications
            .AsNoTracking()
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.CreatedAt)
            .ThenByDescending(a => a.Id)
            .FirstOrDefaultAsync();

        return application is null ? NotFound() : Ok(ToResponse(application));
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
            application.UpdatedAt
        );

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
