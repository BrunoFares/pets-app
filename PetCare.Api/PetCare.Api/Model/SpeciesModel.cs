using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace PetCare.Api.Model
{
    public class SpeciesModel
    {
        public int Id { get; set; }
        public string Code { get; set; } = null!;   // e.g., "cat", "dog"
        public string Name { get; set; } = null!;   // display name

        [JsonIgnore]
        public List<BreedModel> Breeds { get; set; } = new();
    }
}
