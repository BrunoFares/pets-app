namespace PetCare.Api.Model
{
    public enum PetSex { Male, Female, Unknown }

    public class PetModel
    {
        public Guid Id { get; set; }
        public long UserId { get; set; }              // BIGINT (matches users.id)
        public string Name { get; set; } = null!;
        public int SpeciesId { get; set; }
        public int? BreedId { get; set; }
        public PetSex Sex { get; set; } = PetSex.Unknown;
        public DateTime? BirthDate { get; set; }
        public int? ApproxAgeMonths { get; set; }
        public decimal? WeightKg { get; set; }
        public string? Color { get; set; }
        public bool Neutered { get; set; }
        public string? AvatarUrl { get; set; }        // user-uploaded URL (or CDN URL)
        public string? Notes { get; set; }
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

        public SpeciesModel Species { get; set; } = null!;
        public BreedModel? Breed { get; set; }
    }
}
