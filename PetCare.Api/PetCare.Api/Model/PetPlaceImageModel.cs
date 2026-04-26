namespace PetCare.Api.Model;

public class PetPlaceImageModel
{
    public long Id { get; set; }
    public Guid PetPlaceId { get; set; }
    public string Url { get; set; } = default!;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public PetPlaceModel PetPlace { get; set; } = null!;
}
