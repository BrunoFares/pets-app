namespace PetCare.Api.Model;

public class PetModel
{
    public Guid Id { get; set; }
    public long UserId { get; set; }
    public string Name { get; set; } = null!;
    public int SpeciesId { get; set; }
    public int? BreedId { get; set; }
    public PetSex Sex { get; set; } = PetSex.Unknown;
    public DateTimeOffset? BirthDate { get; set; }
    public decimal? WeightKg { get; set; }
    public PetColor Color { get; set; } = PetColor.Unknown;
    public bool Neutered { get; set; }
    public string? AvatarUrl { get; set; }
    public string? Notes { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public AppUser User { get; set; } = null!;
    public SpeciesModel Species { get; set; } = null!;
    public BreedModel? Breed { get; set; }
    public List<ConsultationModel> Consultations { get; set; } = new();
    public List<VaccineRecordModel> VaccineRecords { get; set; } = new();
    public List<IllnessRecordModel> IllnessRecords { get; set; } = new();
}
