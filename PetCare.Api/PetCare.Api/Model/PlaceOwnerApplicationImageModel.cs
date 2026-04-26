namespace PetCare.Api.Model;

public class PlaceOwnerApplicationImageModel
{
    public long Id { get; set; }
    public long PlaceOwnerApplicationId { get; set; }
    public string Url { get; set; } = default!;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public PlaceOwnerApplicationModel PlaceOwnerApplication { get; set; } = null!;
}
