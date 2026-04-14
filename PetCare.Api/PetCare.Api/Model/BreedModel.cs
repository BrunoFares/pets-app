namespace PetCare.Api.Model;

public class BreedModel
{
    public int Id { get; set; }
    public int SpeciesId { get; set; }
    public string Name { get; set; } = null!;

    public SpeciesModel Species { get; set; } = null!;
    public List<PetModel> Pets { get; set; } = new();
}
