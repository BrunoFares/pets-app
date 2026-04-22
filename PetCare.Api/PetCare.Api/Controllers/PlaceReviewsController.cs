using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetCare.Api.Data;
using PetCare.Api.DTOs;
using PetCare.Api.Model;
using PetCare.Api.Security;

namespace PetCare.Api.Controllers;

[ApiController]
[Route("api/places/{placeId:guid}/reviews")]
public class PlaceReviewsController : ControllerBase
{
    private readonly AppDbContext _db;

    public PlaceReviewsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetForPlace(Guid placeId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        if (page < 1)
        {
            return BadRequest(new { message = "page must be greater than or equal to 1." });
        }

        if (pageSize < 1 || pageSize > 100)
        {
            return BadRequest(new { message = "pageSize must be between 1 and 100." });
        }

        var placeExists = await _db.PetPlaces.AsNoTracking().AnyAsync(p => p.Id == placeId);
        if (!placeExists)
        {
            return NotFound(new { message = "Place not found." });
        }

        var query = _db.PetPlaceReviews
            .AsNoTracking()
            .Where(r => r.PlaceId == placeId)
            .OrderByDescending(r => r.CreatedAt)
            .ThenByDescending(r => r.Id)
            .Select(r => new PlaceReviewResponse(
                r.Id,
                r.PlaceId,
                r.UserId,
                GetDisplayName(r.User.Username, r.User.FirstName, r.User.LastName),
                r.Rating,
                r.Comment,
                r.CreatedAt,
                r.UpdatedAt
            ));

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);
        return Ok(new PlaceReviewListResponse(items, page, pageSize, totalCount, totalPages));
    }

    [HttpPost]
    [Authorize(Policy = AuthConstants.Policies.UserOnly)]
    public async Task<IActionResult> Create(Guid placeId, [FromBody] CreatePlaceReviewRequest request)
    {
        var userId = User.GetUserId();
        var placeExists = await _db.PetPlaces.AsNoTracking().AnyAsync(p => p.Id == placeId);
        if (!placeExists)
        {
            return NotFound(new { message = "Place not found." });
        }

        var alreadyReviewed = await _db.PetPlaceReviews
            .AsNoTracking()
            .AnyAsync(r => r.PlaceId == placeId && r.UserId == userId);

        if (alreadyReviewed)
        {
            return Conflict(new { message = "You have already reviewed this place." });
        }

        var review = new PetPlaceReviewModel
        {
            Id = Guid.NewGuid(),
            PlaceId = placeId,
            UserId = userId,
            Rating = request.Rating,
            Comment = NormalizeComment(request.Comment),
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.PetPlaceReviews.Add(review);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            var duplicateExists = await _db.PetPlaceReviews
                .AsNoTracking()
                .AnyAsync(r => r.PlaceId == placeId && r.UserId == userId);

            if (duplicateExists)
            {
                return Conflict(new { message = "You have already reviewed this place." });
            }

            throw;
        }

        var response = await _db.PetPlaceReviews
            .AsNoTracking()
            .Where(r => r.Id == review.Id)
            .Select(r => new PlaceReviewResponse(
                r.Id,
                r.PlaceId,
                r.UserId,
                GetDisplayName(r.User.Username, r.User.FirstName, r.User.LastName),
                r.Rating,
                r.Comment,
                r.CreatedAt,
                r.UpdatedAt
            ))
            .FirstAsync();

        return CreatedAtAction(nameof(GetForPlace), new { placeId }, response);
    }

    [HttpPut("{reviewId:guid}")]
    [Authorize(Policy = AuthConstants.Policies.UserOnly)]
    public async Task<IActionResult> Update(Guid placeId, Guid reviewId, [FromBody] UpdatePlaceReviewRequest request)
    {
        var userId = User.GetUserId();
        var review = await _db.PetPlaceReviews
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Id == reviewId && r.PlaceId == placeId && r.UserId == userId);

        if (review is null)
        {
            return NotFound(new { message = "Review not found." });
        }

        review.Rating = request.Rating;
        review.Comment = NormalizeComment(request.Comment);
        review.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new PlaceReviewResponse(
            review.Id,
            review.PlaceId,
            review.UserId,
            GetDisplayName(review.User),
            review.Rating,
            review.Comment,
            review.CreatedAt,
            review.UpdatedAt
        ));
    }

    [HttpDelete("{reviewId:guid}")]
    [Authorize(Policy = AuthConstants.Policies.UserOnly)]
    public async Task<IActionResult> Delete(Guid placeId, Guid reviewId)
    {
        var userId = User.GetUserId();
        var review = await _db.PetPlaceReviews
            .FirstOrDefaultAsync(r => r.Id == reviewId && r.PlaceId == placeId && r.UserId == userId);

        if (review is null)
        {
            return NotFound(new { message = "Review not found." });
        }

        _db.PetPlaceReviews.Remove(review);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static string? NormalizeComment(string? comment)
    {
        if (comment is null)
        {
            return null;
        }

        var trimmed = comment.Trim();
        return trimmed.Length == 0 ? null : trimmed;
    }

    private static string GetDisplayName(AppUser user)
    {
        var fullName = $"{user.FirstName} {user.LastName}".Trim();
        return string.IsNullOrWhiteSpace(fullName) ? user.Username : fullName;
    }

    private static string GetDisplayName(string username, string firstName, string lastName)
    {
        var fullName = $"{firstName} {lastName}".Trim();
        return string.IsNullOrWhiteSpace(fullName) ? username : fullName;
    }
}
