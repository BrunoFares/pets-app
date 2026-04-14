namespace PetCare.Api.Model;

public class SpeciesModel
{
    public int Id { get; set; }
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;

    public List<BreedModel> Breeds { get; set; } = new();
    public List<PetModel> Pets { get; set; } = new();
}
