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
[Route("api/admin/reports")]
[Authorize(Policy = AuthConstants.Policies.AdminOnly)]
public class AdminReportsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AdminAuditLogger _auditLogger;
    private static readonly string[] AllowedSorts = ["highestpriority", "newest", "oldest", "mostreported"];

    public AdminReportsController(AppDbContext db, AdminAuditLogger auditLogger)
    {
        _db = db;
        _auditLogger = auditLogger;
    }

    [HttpGet]
    public async Task<IActionResult> GetReports(
        [FromQuery] ReportStatus? status,
        [FromQuery] ReportTargetType? targetType,
        [FromQuery] ReportReasonType? reasonType,
        [FromQuery] long? reporterUserId,
        [FromQuery] ReportPriority? priority,
        [FromQuery] DateTimeOffset? from,
        [FromQuery] DateTimeOffset? to,
        [FromQuery] string? sort = "highestPriority",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (!TryValidateListRequest(page, pageSize, sort, from, to, out var error))
        {
            return error!;
        }

        var normalizedSort = NormalizeSort(sort);
        var baseRows = await BuildBaseQuery(status, targetType, reasonType, reporterUserId, from, to)
            .ToListAsync();

        var statsByTarget = await GetPendingStatsByTargetAsync(baseRows);
        var rows = baseRows
            .Select(row => ToComputedRow(row, statsByTarget))
            .ToList();

        if (priority.HasValue)
        {
            rows = rows.Where(r => r.Priority == priority.Value).ToList();
        }

        rows = ApplySorting(rows, normalizedSort).ToList();

        var totalCount = rows.Count;
        var items = rows
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(ToListItemResponse)
            .ToList();

        var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);
        return Ok(new AdminReportListResponse(items, page, pageSize, totalCount, totalPages));
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetReportById(long id)
    {
        var row = await GetBaseRowByIdAsync(id);

        if (row is null)
        {
            return NotFound();
        }

        var stats = await GetPendingStatsByTargetAsync(new[] { row });
        var computedRow = ToComputedRow(row, stats);

        return Ok(ToDetailsResponse(computedRow));
    }

    [HttpPost("{id:long}/dismiss")]
    public async Task<IActionResult> DismissReport(long id, [FromBody] DismissReportRequest request)
    {
        var adminUserId = User.GetAdminId();
        var report = await _db.Reports.FirstOrDefaultAsync(r => r.Id == id);
        if (report is null)
        {
            return NotFound();
        }

        if (report.Status != ReportStatus.Pending)
        {
            return Conflict(new { message = "Only pending reports can be dismissed." });
        }

        report.Status = ReportStatus.Dismissed;
        report.ReviewedByAdminId = adminUserId;
        report.ReviewedAt = DateTimeOffset.UtcNow;

        _auditLogger.Log(
            adminUserId,
            "DismissReport",
            "Report",
            report.Id.ToString(),
            $"Dismissed report '{report.Id}' against target '{report.TargetType}:{report.TargetId}'.",
            NormalizeText(request.Note)
        );

        await _db.SaveChangesAsync();
        return await GetReportById(id);
    }

    [HttpPost("{id:long}/resolve")]
    public async Task<IActionResult> ResolveReport(long id, [FromBody] ResolveReportRequest request)
    {
        var adminUserId = User.GetAdminId();
        var report = await _db.Reports.FirstOrDefaultAsync(r => r.Id == id);
        if (report is null)
        {
            return NotFound();
        }

        if (report.Status != ReportStatus.Pending)
        {
            return Conflict(new { message = "Only pending reports can be resolved." });
        }

        report.Status = request.Status;
        report.ReviewedByAdminId = adminUserId;
        report.ReviewedAt = DateTimeOffset.UtcNow;

        _auditLogger.Log(
            adminUserId,
            "ResolveReport",
            "Report",
            report.Id.ToString(),
            $"Resolved report '{report.Id}' against target '{report.TargetType}:{report.TargetId}' with status '{report.Status}'.",
            NormalizeText(request.Note)
        );

        await _db.SaveChangesAsync();
        return await GetReportById(id);
    }

    private Task<AdminReportBaseRow?> GetBaseRowByIdAsync(long id) =>
        _db.Reports
            .AsNoTracking()
            .Where(r => r.Id == id)
            .Select(r => new AdminReportBaseRow(
                r.Id,
                r.ReporterUserId,
                r.ReporterUser.Username,
                r.ReporterUser.FirstName,
                r.ReporterUser.LastName,
                r.TargetType,
                r.TargetId,
                r.ReasonType,
                r.Description,
                r.Status,
                r.ReviewedByAdminId,
                r.ReviewedByAdmin != null ? r.ReviewedByAdmin.Username : null,
                r.ReviewedAt,
                r.CreatedAt
            ))
            .FirstOrDefaultAsync();

    private IQueryable<AdminReportBaseRow> BuildBaseQuery(
        ReportStatus? status = null,
        ReportTargetType? targetType = null,
        ReportReasonType? reasonType = null,
        long? reporterUserId = null,
        DateTimeOffset? from = null,
        DateTimeOffset? to = null)
    {
        var reports = _db.Reports
            .AsNoTracking()
            .AsQueryable();

        if (status.HasValue)
        {
            reports = reports.Where(r => r.Status == status.Value);
        }

        if (targetType.HasValue)
        {
            reports = reports.Where(r => r.TargetType == targetType.Value);
        }

        if (reasonType.HasValue)
        {
            reports = reports.Where(r => r.ReasonType == reasonType.Value);
        }

        if (reporterUserId.HasValue)
        {
            reports = reports.Where(r => r.ReporterUserId == reporterUserId.Value);
        }

        if (from.HasValue)
        {
            reports = reports.Where(r => r.CreatedAt >= from.Value);
        }

        if (to.HasValue)
        {
            reports = reports.Where(r => r.CreatedAt <= to.Value);
        }

        return reports
            .Select(r => new AdminReportBaseRow(
                r.Id,
                r.ReporterUserId,
                r.ReporterUser.Username,
                r.ReporterUser.FirstName,
                r.ReporterUser.LastName,
                r.TargetType,
                r.TargetId,
                r.ReasonType,
                r.Description,
                r.Status,
                r.ReviewedByAdminId,
                r.ReviewedByAdmin != null ? r.ReviewedByAdmin.Username : null,
                r.ReviewedAt,
                r.CreatedAt
            ));
    }

    private async Task<Dictionary<(ReportTargetType TargetType, string TargetId), PendingTargetStats>> GetPendingStatsByTargetAsync(IEnumerable<AdminReportBaseRow> rows)
    {
        var targetKeys = rows
            .Select(r => (r.TargetType, r.TargetId))
            .Distinct()
            .ToList();

        if (targetKeys.Count == 0)
        {
            return new Dictionary<(ReportTargetType TargetType, string TargetId), PendingTargetStats>();
        }

        var targetTypes = targetKeys.Select(k => k.TargetType).Distinct().ToList();
        var targetIds = targetKeys.Select(k => k.TargetId).Distinct().ToList();

        var pendingRows = await _db.Reports
            .AsNoTracking()
            .Where(r => r.Status == ReportStatus.Pending)
            .Where(r => targetTypes.Contains(r.TargetType) && targetIds.Contains(r.TargetId))
            .Select(r => new PendingReportStatRow(r.TargetType, r.TargetId, r.ReporterUserId, r.ReasonType))
            .ToListAsync();

        return pendingRows
            .GroupBy(r => (r.TargetType, r.TargetId))
            .ToDictionary(
                g => g.Key,
                g => new PendingTargetStats(
                    g.Count(),
                    g.Select(x => x.ReporterUserId).Distinct().Count(),
                    g.Count(x => IsSevereReason(x.ReasonType))
                ));
    }

    private static ComputedAdminReportRow ToComputedRow(
        AdminReportBaseRow row,
        IReadOnlyDictionary<(ReportTargetType TargetType, string TargetId), PendingTargetStats> statsByTarget)
    {
        statsByTarget.TryGetValue((row.TargetType, row.TargetId), out var stats);
        stats ??= PendingTargetStats.Empty;

        return new ComputedAdminReportRow(
            row.Id,
            row.ReporterUserId,
            row.ReporterUsername,
            row.ReporterFirstName,
            row.ReporterLastName,
            row.TargetType,
            row.TargetId,
            row.ReasonType,
            row.Description,
            row.Status,
            row.ReviewedByAdminId,
            row.ReviewedByAdminUsername,
            row.ReviewedAt,
            row.CreatedAt,
            stats.PendingReportsForTarget,
            stats.DistinctPendingReportersForTarget,
            ComputePriority(stats)
        );
    }

    private static IEnumerable<ComputedAdminReportRow> ApplySorting(IEnumerable<ComputedAdminReportRow> rows, string sort)
    {
        return sort switch
        {
            "oldest" => rows
                .OrderBy(r => r.CreatedAt)
                .ThenBy(r => r.Id),
            "mostreported" => rows
                .OrderByDescending(r => r.DistinctPendingReportersForTarget)
                .ThenByDescending(r => r.PendingReportsForTarget)
                .ThenByDescending(r => r.CreatedAt)
                .ThenByDescending(r => r.Id),
            "newest" => rows
                .OrderByDescending(r => r.CreatedAt)
                .ThenByDescending(r => r.Id),
            _ => rows
                .OrderByDescending(r => r.Priority)
                .ThenByDescending(r => r.DistinctPendingReportersForTarget)
                .ThenByDescending(r => r.PendingReportsForTarget)
                .ThenByDescending(r => r.CreatedAt)
                .ThenByDescending(r => r.Id)
        };
    }

    private static ReportPriority ComputePriority(PendingTargetStats stats)
    {
        if (stats.DistinctPendingReportersForTarget >= 3 ||
            stats.PendingReportsForTarget >= 5 ||
            stats.SeverePendingReportsForTarget >= 2)
        {
            return ReportPriority.High;
        }

        if (stats.DistinctPendingReportersForTarget >= 2 ||
            stats.PendingReportsForTarget >= 2 ||
            stats.SeverePendingReportsForTarget >= 1)
        {
            return ReportPriority.Medium;
        }

        return ReportPriority.Low;
    }

    private static bool IsSevereReason(ReportReasonType reasonType) =>
        reasonType is ReportReasonType.Abuse or ReportReasonType.Harassment or ReportReasonType.Scam;

    private static AdminReportListItemResponse ToListItemResponse(ComputedAdminReportRow row) =>
        new(
            row.Id,
            row.ReporterUserId,
            row.ReporterUsername,
            GetDisplayName(row.ReporterUsername, row.ReporterFirstName, row.ReporterLastName),
            row.TargetType,
            row.TargetId,
            row.ReasonType,
            row.Description,
            row.Status,
            row.ReviewedByAdminId,
            row.ReviewedByAdminUsername,
            row.ReviewedAt,
            row.CreatedAt,
            row.PendingReportsForTarget,
            row.DistinctPendingReportersForTarget,
            row.Priority
        );

    private static AdminReportDetailsResponse ToDetailsResponse(ComputedAdminReportRow row) =>
        new(
            row.Id,
            row.ReporterUserId,
            row.ReporterUsername,
            GetDisplayName(row.ReporterUsername, row.ReporterFirstName, row.ReporterLastName),
            row.TargetType,
            row.TargetId,
            row.ReasonType,
            row.Description,
            row.Status,
            row.ReviewedByAdminId,
            row.ReviewedByAdminUsername,
            row.ReviewedAt,
            row.CreatedAt,
            row.PendingReportsForTarget,
            row.DistinctPendingReportersForTarget,
            row.Priority
        );

    private static bool TryValidateListRequest(
        int page,
        int pageSize,
        string? sort,
        DateTimeOffset? from,
        DateTimeOffset? to,
        out IActionResult? error)
    {
        if (page < 1)
        {
            error = new BadRequestObjectResult(new { message = "page must be greater than or equal to 1." });
            return false;
        }

        if (pageSize < 1 || pageSize > 200)
        {
            error = new BadRequestObjectResult(new { message = "pageSize must be between 1 and 200." });
            return false;
        }

        var normalizedSort = NormalizeSort(sort);
        if (!AllowedSorts.Contains(normalizedSort))
        {
            error = new BadRequestObjectResult(new { message = "sort must be one of: highestPriority, newest, oldest, mostReported." });
            return false;
        }

        if (from.HasValue && to.HasValue && from.Value > to.Value)
        {
            error = new BadRequestObjectResult(new { message = "from must be earlier than or equal to to." });
            return false;
        }

        error = null;
        return true;
    }

    private static string NormalizeSort(string? sort) =>
        string.IsNullOrWhiteSpace(sort) ? "highestpriority" : sort.Trim().ToLowerInvariant();

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

    private sealed record AdminReportBaseRow(
        long Id,
        long ReporterUserId,
        string ReporterUsername,
        string ReporterFirstName,
        string ReporterLastName,
        ReportTargetType TargetType,
        string TargetId,
        ReportReasonType ReasonType,
        string? Description,
        ReportStatus Status,
        long? ReviewedByAdminId,
        string? ReviewedByAdminUsername,
        DateTimeOffset? ReviewedAt,
        DateTimeOffset CreatedAt
    );

    private sealed record ComputedAdminReportRow(
        long Id,
        long ReporterUserId,
        string ReporterUsername,
        string ReporterFirstName,
        string ReporterLastName,
        ReportTargetType TargetType,
        string TargetId,
        ReportReasonType ReasonType,
        string? Description,
        ReportStatus Status,
        long? ReviewedByAdminId,
        string? ReviewedByAdminUsername,
        DateTimeOffset? ReviewedAt,
        DateTimeOffset CreatedAt,
        int PendingReportsForTarget,
        int DistinctPendingReportersForTarget,
        ReportPriority Priority
    );

    private sealed record PendingReportStatRow(
        ReportTargetType TargetType,
        string TargetId,
        long ReporterUserId,
        ReportReasonType ReasonType
    );

    private sealed record PendingTargetStats(
        int PendingReportsForTarget,
        int DistinctPendingReportersForTarget,
        int SeverePendingReportsForTarget)
    {
        public static PendingTargetStats Empty { get; } = new(0, 0, 0);
    }
}
