using System.ComponentModel.DataAnnotations;
using PetCare.Api.Model;

namespace PetCare.Api.DTOs;

public record CreatePetRequest(
    [Required, MaxLength(120)] string Name,
    [Range(1, int.MaxValue)] int SpeciesId,
    int? BreedId,
    [Required] PetSex Sex,
    DateTimeOffset? BirthDate,
    [Range(0, 200)] decimal? WeightKg,
    [Required] PetColor Color,
    bool Neutered,
    [MaxLength(2000)] string? Notes
);

public record UpdatePetRequest(
    [Required, MaxLength(120)] string Name,
    [Range(1, int.MaxValue)] int SpeciesId,
    int? BreedId,
    [Required] PetSex Sex,
    DateTimeOffset? BirthDate,
    [Range(0, 200)] decimal? WeightKg,
    [Required] PetColor Color,
    bool Neutered,
    [MaxLength(2000)] string? Notes
);

public record PetResponse(
    Guid Id,
    long UserId,
    string Name,
    int SpeciesId,
    string Species,
    int? BreedId,
    string? Breed,
    PetSex Sex,
    DateTimeOffset? BirthDate,
    decimal? WeightKg,
    PetColor Color,
    bool Neutered,
    string? AvatarUrl,
    string? Notes,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);
