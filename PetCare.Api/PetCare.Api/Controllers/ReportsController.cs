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
[Authorize(Policy = AuthConstants.Policies.UserOnly)]
public class ReportsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ReportsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateReportRequest request)
    {
        var reporterUserId = User.GetUserId();
        var targetValidation = await ValidateAndNormalizeTargetAsync(request.TargetType, request.TargetId, reporterUserId);
        if (!targetValidation.IsValid)
        {
            return BadRequest(new { message = targetValidation.ErrorMessage });
        }

        var normalizedTargetId = targetValidation.NormalizedTargetId!;
        var duplicatePendingReportExists = await _db.Reports
            .AsNoTracking()
            .AnyAsync(r =>
                r.ReporterUserId == reporterUserId &&
                r.TargetType == request.TargetType &&
                r.TargetId == normalizedTargetId &&
                r.Status == ReportStatus.Pending);

        if (duplicatePendingReportExists)
        {
            return Conflict(new { message = "You already have a pending report for this target." });
        }

        var report = new ReportModel
        {
            ReporterUserId = reporterUserId,
            TargetType = request.TargetType,
            TargetId = normalizedTargetId,
            ReasonType = request.ReasonType,
            Description = NormalizeText(request.Description),
            Status = ReportStatus.Pending,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.Reports.Add(report);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            var duplicateStillExists = await _db.Reports
                .AsNoTracking()
                .AnyAsync(r =>
                    r.ReporterUserId == reporterUserId &&
                    r.TargetType == request.TargetType &&
                    r.TargetId == normalizedTargetId &&
                    r.Status == ReportStatus.Pending);

            if (duplicateStillExists)
            {
                return Conflict(new { message = "You already have a pending report for this target." });
            }

            throw;
        }

        return StatusCode(StatusCodes.Status201Created, new ReportResponse(
            report.Id,
            report.ReporterUserId,
            report.TargetType,
            report.TargetId,
            report.ReasonType,
            report.Description,
            report.Status,
            report.ReviewedByAdminId,
            report.ReviewedAt,
            report.CreatedAt
        ));
    }

    private async Task<(bool IsValid, string? NormalizedTargetId, string? ErrorMessage)> ValidateAndNormalizeTargetAsync(
        ReportTargetType targetType,
        string rawTargetId,
        long reporterUserId)
    {
        if (string.IsNullOrWhiteSpace(rawTargetId))
        {
            return (false, null, "TargetId is required.");
        }

        var trimmedTargetId = rawTargetId.Trim();
        switch (targetType)
        {
            case ReportTargetType.ForumPost:
                if (!Guid.TryParse(trimmedTargetId, out var forumPostId))
                {
                    return (false, null, "TargetId must be a valid forum post id.");
                }

                var forumPost = await _db.ForumPosts
                    .AsNoTracking()
                    .Where(p => p.Id == forumPostId)
                    .Select(p => new { p.Id, p.UserId })
                    .FirstOrDefaultAsync();

                if (forumPost is null)
                {
                    return (false, null, "Forum post not found.");
                }

                if (forumPost.UserId == reporterUserId)
                {
                    return (false, null, "You cannot report your own forum post.");
                }

                return (true, forumPost.Id.ToString(), null);

            case ReportTargetType.User:
                if (!long.TryParse(trimmedTargetId, out var userId))
                {
                    return (false, null, "TargetId must be a valid user id.");
                }

                var userExists = await _db.Users
                    .AsNoTracking()
                    .AnyAsync(u => u.Id == userId);

                if (!userExists)
                {
                    return (false, null, "User not found.");
                }

                if (userId == reporterUserId)
                {
                    return (false, null, "You cannot report yourself.");
                }

                return (true, userId.ToString(), null);

            default:
                return (false, null, "Unsupported report target type.");
        }
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
