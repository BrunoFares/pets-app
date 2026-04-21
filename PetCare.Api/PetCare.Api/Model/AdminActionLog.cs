namespace PetCare.Api.Model;

public class AdminActionLog
{
    public long Id { get; set; }
    public long AdminUserId { get; set; }
    public string ActionType { get; set; } = default!;
    public string TargetType { get; set; } = default!;
    public string TargetId { get; set; } = default!;
    public string Description { get; set; } = default!;
    public string? Reason { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public AdminUser AdminUser { get; set; } = default!;
}
