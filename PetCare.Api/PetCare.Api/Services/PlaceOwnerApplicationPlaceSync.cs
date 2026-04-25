using Microsoft.EntityFrameworkCore;
using PetCare.Api.Data;
using PetCare.Api.Model;

namespace PetCare.Api.Services;

public static class PlaceOwnerApplicationPlaceSync
{
    public static PetPlaceModel CreatePlaceFromApplication(PlaceOwnerApplicationModel application)
    {
        return new PetPlaceModel
        {
            Id = Guid.NewGuid(),
            OwnerUserId = application.UserId,
            Name = application.BusinessName.Trim(),
            Phone = application.Phone.Trim(),
            Email = application.Email.Trim().ToLowerInvariant(),
            Description = NormalizeText(application.Description),
            AddressLine1 = application.AddressLine1.Trim(),
            AddressLine2 = NormalizeText(application.AddressLine2),
            City = application.City.Trim(),
            Country = application.Country.Trim(),
            Status = PlaceStatus.Active,
            Type = application.RequestedPlaceType,
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    public static async Task<IReadOnlyList<PetPlaceModel>> BackfillMissingPlacesAsync(
        AppDbContext db,
        CancellationToken cancellationToken = default)
    {
        var approvedApplicationsWithoutPlaces = await db.PlaceOwnerApplications
            .AsNoTracking()
            .Where(a => a.Status == PlaceOwnerApplicationStatus.Approved && a.User.IsApprovedPlaceOwner)
            .Where(a => !db.PetPlaces.Any(p => p.OwnerUserId == a.UserId))
            .OrderByDescending(a => a.ReviewedAt ?? a.CreatedAt)
            .ThenByDescending(a => a.Id)
            .ToListAsync(cancellationToken);

        var latestApplicationsByUser = approvedApplicationsWithoutPlaces
            .GroupBy(a => a.UserId)
            .Select(g => g.First())
            .ToList();

        if (latestApplicationsByUser.Count == 0)
        {
            return Array.Empty<PetPlaceModel>();
        }

        var createdPlaces = new List<PetPlaceModel>(latestApplicationsByUser.Count);
        foreach (var application in latestApplicationsByUser)
        {
            var place = CreatePlaceFromApplication(application);
            db.PetPlaces.Add(place);
            createdPlaces.Add(place);
        }

        await db.SaveChangesAsync(cancellationToken);
        return createdPlaces;
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
