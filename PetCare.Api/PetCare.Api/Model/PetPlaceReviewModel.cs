namespace PetCare.Api.Model;

public class PetPlaceReviewModel
{
    public Guid Id { get; set; }
    public Guid PlaceId { get; set; }
    public long UserId { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAt { get; set; }

    public PetPlaceModel Place { get; set; } = default!;
    public AppUser User { get; set; } = default!;
}
