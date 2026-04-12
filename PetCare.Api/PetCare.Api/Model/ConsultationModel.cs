namespace PetCare.Api.Model;

public class ConsultationModel
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public Guid PetId { get; set; }
    public Guid? VetPlaceId { get; set; }
    public DateTimeOffset Date { get; set; }
    public string Details { get; set; } = default!;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAt { get; set; }

    public AppUser User { get; set; } = null!;
    public PetModel Pet { get; set; } = null!;
    public PetPlaceModel? VetPlace { get; set; }
}
