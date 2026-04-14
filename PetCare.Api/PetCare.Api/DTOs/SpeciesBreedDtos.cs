using System.ComponentModel.DataAnnotations;

namespace PetCare.Api.DTOs;

public record CreateSpeciesRequest(
    [Required, MaxLength(50)] string Code,
    [Required, MaxLength(100)] string Name
);

public record UpdateSpeciesRequest(
    [Required, MaxLength(50)] string Code,
    [Required, MaxLength(100)] string Name
);

public record SpeciesResponse(int Id, string Code, string Name, IReadOnlyList<BreedSummaryResponse> Breeds);

public record BreedSummaryResponse(int Id, int SpeciesId, string Name);

public record CreateBreedRequest(
    [Range(1, int.MaxValue)] int SpeciesId,
    [Required, MaxLength(100)] string Name
);

public record UpdateBreedRequest(
    [Range(1, int.MaxValue)] int SpeciesId,
    [Required, MaxLength(100)] string Name
);

public record BreedResponse(int Id, int SpeciesId, string Species, string Name);
