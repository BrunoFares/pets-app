namespace PetCare.Api.Model;

public class ConsultationModel
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public Guid PetId { get; set; }
    public string VetId { get; set; } = default!;
    public DateTimeOffset Date { get; set; }
    public string Details { get; set; } = default!;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAt { get; set; }

    public PetModel? Pet { get; set; }
}