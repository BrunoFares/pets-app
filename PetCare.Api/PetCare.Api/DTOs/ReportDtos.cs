using System.ComponentModel.DataAnnotations;
using PetCare.Api.Model;

namespace PetCare.Api.DTOs;

public record CreateReportRequest(
    [Required] ReportTargetType TargetType,
    [Required, MaxLength(100)] string TargetId,
    [Required] ReportReasonType ReasonType,
    [MaxLength(2000)] string? Description
);

public record ReportResponse(
    long Id,
    long ReporterUserId,
    ReportTargetType TargetType,
    string TargetId,
    ReportReasonType ReasonType,
    string? Description,
    ReportStatus Status,
    long? ReviewedByAdminId,
    DateTimeOffset? ReviewedAt,
    DateTimeOffset CreatedAt
);

public record DismissReportRequest([MaxLength(1000)] string? Note);

public record ResolveReportRequest(
    [Required] ReportStatus Status,
    [MaxLength(1000)] string? Note
) : IValidatableObject
{
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Status is ReportStatus.Reviewed or ReportStatus.ActionTaken)
        {
            yield break;
        }

        yield return new ValidationResult(
            "Status must be Reviewed or ActionTaken when resolving a report.",
            new[] { nameof(Status) });
    }
}

public record AdminReportListItemResponse(
    long Id,
    long ReporterUserId,
    string ReporterUsername,
    string ReporterDisplayName,
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

public record AdminReportDetailsResponse(
    long Id,
    long ReporterUserId,
    string ReporterUsername,
    string ReporterDisplayName,
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

public record AdminReportListResponse(
    IReadOnlyList<AdminReportListItemResponse> Items,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages
);
