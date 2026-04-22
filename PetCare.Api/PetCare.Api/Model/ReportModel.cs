namespace PetCare.Api.Model;

public class ReportModel
{
    public long Id { get; set; }
    public long ReporterUserId { get; set; }
    public ReportTargetType TargetType { get; set; }
    public string TargetId { get; set; } = default!;
    public ReportReasonType ReasonType { get; set; }
    public string? Description { get; set; }
    public ReportStatus Status { get; set; } = ReportStatus.Pending;
    public long? ReviewedByAdminId { get; set; }
    public DateTimeOffset? ReviewedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public AppUser ReporterUser { get; set; } = default!;
    public AdminUser? ReviewedByAdmin { get; set; }
}
