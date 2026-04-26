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
[Route("api/admin/place-owner-applications")]
[Authorize(Policy = AuthConstants.Policies.AdminOnly)]
public class AdminPlaceOwnerApplicationsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AdminAuditLogger _auditLogger;

    public AdminPlaceOwnerApplicationsController(AppDbContext db, AdminAuditLogger auditLogger)
    {
        _db = db;
        _auditLogger = auditLogger;
    }

    [HttpGet]
    public async Task<IActionResult> GetApplications(
        [FromQuery] PlaceOwnerApplicationStatus? status,
        [FromQuery] long? userId,
        [FromQuery] PlaceType? requestedPlaceType,
        [FromQuery] DateTimeOffset? from,
        [FromQuery] DateTimeOffset? to,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (page < 1)
        {
            return BadRequest(new { message = "page must be greater than or equal to 1." });
        }

        if (pageSize < 1 || pageSize > 200)
        {
            return BadRequest(new { message = "pageSize must be between 1 and 200." });
        }

        if (from.HasValue && to.HasValue && from.Value > to.Value)
        {
            return BadRequest(new { message = "from must be earlier than or equal to to." });
        }

        var query = _db.PlaceOwnerApplications
            .AsNoTracking()
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(a => a.Status == status.Value);
        }

        if (userId.HasValue)
        {
            query = query.Where(a => a.UserId == userId.Value);
        }

        if (requestedPlaceType.HasValue)
        {
            query = query.Where(a => a.RequestedPlaceType == requestedPlaceType.Value);
        }

        if (from.HasValue)
        {
            query = query.Where(a => a.CreatedAt >= from.Value);
        }

        if (to.HasValue)
        {
            query = query.Where(a => a.CreatedAt <= to.Value);
        }

        query = query
            .OrderByDescending(a => a.CreatedAt)
            .ThenByDescending(a => a.Id);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AdminPlaceOwnerApplicationListItemResponse(
                a.Id,
                a.UserId,
                a.User.Username,
                GetDisplayName(a.User.Username, a.User.FirstName, a.User.LastName),
                a.BusinessName,
                a.Phone,
                a.Email,
                a.City,
                a.Country,
                a.RequestedPlaceType,
                a.Status,
                a.RejectionReason,
                a.AdminNotes,
                a.ReviewedByAdminId,
                a.ReviewedByAdmin != null ? a.ReviewedByAdmin.Username : null,
                a.ReviewedAt,
                a.CreatedAt,
                a.UpdatedAt
            ))
            .ToListAsync();

        var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);
        return Ok(new AdminPlaceOwnerApplicationListResponse(items, page, pageSize, totalCount, totalPages));
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var application = await _db.PlaceOwnerApplications
            .AsNoTracking()
            .Where(a => a.Id == id)
            .Select(a => new AdminPlaceOwnerApplicationDetailsResponse(
                a.Id,
                a.UserId,
                a.User.Username,
                GetDisplayName(a.User.Username, a.User.FirstName, a.User.LastName),
                a.BusinessName,
                a.Phone,
                a.Email,
                a.Description,
                a.AddressLine1,
                a.AddressLine2,
                a.City,
                a.Country,
                a.RequestedPlaceType,
                a.Status,
                a.RejectionReason,
                a.AdminNotes,
                a.ReviewedByAdminId,
                a.ReviewedByAdmin != null ? a.ReviewedByAdmin.Username : null,
                a.ReviewedAt,
                a.CreatedAt,
                a.UpdatedAt,
                a.Images
                    .OrderBy(i => i.CreatedAt)
                    .ThenBy(i => i.Id)
                    .Select(i => new PlaceOwnerApplicationImageResponse(
                        i.Id,
                        i.Url,
                        i.CreatedAt
                    ))
                    .ToList()
            ))
            .FirstOrDefaultAsync();

        return application is null ? NotFound() : Ok(application);
    }

    [HttpPost("{id:long}/approve")]
    public async Task<IActionResult> Approve(long id, [FromBody] ApprovePlaceOwnerApplicationRequest request)
    {
        var adminUserId = User.GetAdminId();
        var application = await _db.PlaceOwnerApplications
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (application is null)
        {
            return NotFound();
        }

        if (application.Status != PlaceOwnerApplicationStatus.Pending)
        {
            return Conflict(new { message = "Only pending applications can be approved." });
        }

        application.Status = PlaceOwnerApplicationStatus.Approved;
        application.RejectionReason = null;
        application.AdminNotes = NormalizeText(request.AdminNotes);
        application.ReviewedByAdminId = adminUserId;
        application.ReviewedAt = DateTimeOffset.UtcNow;
        application.UpdatedAt = DateTimeOffset.UtcNow;
        application.User.IsApprovedPlaceOwner = true;

        PetPlaceModel? createdPlace = null;
        var hasOwnedPlace = await _db.PetPlaces
            .AsNoTracking()
            .AnyAsync(p => p.OwnerUserId == application.UserId);

        if (!hasOwnedPlace)
        {
            createdPlace = PlaceOwnerApplicationPlaceSync.CreatePlaceFromApplication(application);
            _db.PetPlaces.Add(createdPlace);
        }

        _auditLogger.Log(
            adminUserId,
            "ApprovePlaceOwnerApplication",
            "PlaceOwnerApplication",
            application.Id.ToString(),
            $"Approved place owner application '{application.Id}' for user '{application.UserId}'.",
            application.AdminNotes
        );
        if (createdPlace is not null)
        {
            _auditLogger.Log(
                adminUserId,
                "CreatePlace",
                "Place",
                createdPlace.Id.ToString(),
                $"Created place '{createdPlace.Name}' from approved application '{application.Id}'."
            );
        }

        await _db.SaveChangesAsync();
        return await GetById(id);
    }

    [HttpPost("{id:long}/reject")]
    public async Task<IActionResult> Reject(long id, [FromBody] RejectPlaceOwnerApplicationRequest request)
    {
        var adminUserId = User.GetAdminId();
        var application = await _db.PlaceOwnerApplications
            .FirstOrDefaultAsync(a => a.Id == id);

        if (application is null)
        {
            return NotFound();
        }

        if (application.Status != PlaceOwnerApplicationStatus.Pending)
        {
            return Conflict(new { message = "Only pending applications can be rejected." });
        }

        application.Status = PlaceOwnerApplicationStatus.Rejected;
        application.RejectionReason = request.RejectionReason.Trim();
        application.AdminNotes = NormalizeText(request.AdminNotes);
        application.ReviewedByAdminId = adminUserId;
        application.ReviewedAt = DateTimeOffset.UtcNow;
        application.UpdatedAt = DateTimeOffset.UtcNow;

        _auditLogger.Log(
            adminUserId,
            "RejectPlaceOwnerApplication",
            "PlaceOwnerApplication",
            application.Id.ToString(),
            $"Rejected place owner application '{application.Id}' for user '{application.UserId}'.",
            application.RejectionReason
        );

        await _db.SaveChangesAsync();
        return await GetById(id);
    }

    private static string GetDisplayName(string username, string firstName, string lastName)
    {
        var fullName = $"{firstName} {lastName}".Trim();
        return string.IsNullOrWhiteSpace(fullName) ? username : fullName;
    }

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
