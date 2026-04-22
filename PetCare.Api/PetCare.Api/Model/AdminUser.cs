namespace PetCare.Api.Model;

public class AdminUser
{
    public long Id { get; set; }
    public string Username { get; set; } = default!;
    public string FirstName { get; set; } = default!;
    public string LastName { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string PasswordHash { get; set; } = default!;
    public AdminRole Role { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? LastLogin { get; set; }

    public List<AdminActionLog> ActionLogs { get; set; } = new();
    public List<PlaceOwnerApplicationModel> ReviewedPlaceOwnerApplications { get; set; } = new();
    public List<ReportModel> ReviewedReports { get; set; } = new();
}
