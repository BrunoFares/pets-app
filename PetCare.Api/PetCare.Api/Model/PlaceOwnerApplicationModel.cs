namespace PetCare.Api.Model;

public class PlaceOwnerApplicationModel
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public string BusinessName { get; set; } = default!;
    public string Phone { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string? Description { get; set; }
    public string AddressLine1 { get; set; } = default!;
    public string? AddressLine2 { get; set; }
    public string City { get; set; } = default!;
    public string Country { get; set; } = default!;
    public PlaceType RequestedPlaceType { get; set; }
    public PlaceOwnerApplicationStatus Status { get; set; } = PlaceOwnerApplicationStatus.Pending;
    public string? RejectionReason { get; set; }
    public string? AdminNotes { get; set; }
    public long? ReviewedByAdminId { get; set; }
    public DateTimeOffset? ReviewedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public AppUser User { get; set; } = default!;
    public AdminUser? ReviewedByAdmin { get; set; }
}
