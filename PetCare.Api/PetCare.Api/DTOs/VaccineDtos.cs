using System.ComponentModel.DataAnnotations;
using PetCare.Api.Model;

namespace PetCare.Api.DTOs;

public record CreateVaccineRecordRequest(
    [Required] Guid PetId,
    [Required, MaxLength(200)] string VaccineName,
    [Required] VaccineStatus Status,
    DateTimeOffset? DateAdministered,
    DateTimeOffset? NextDueDate,
    [MaxLength(2000)] string? Notes,
    [MaxLength(200)] string? Veterinarian
);

public record UpdateVaccineRecordRequest(
    [Required, MaxLength(200)] string VaccineName,
    [Required] VaccineStatus Status,
    DateTimeOffset? DateAdministered,
    DateTimeOffset? NextDueDate,
    [MaxLength(2000)] string? Notes,
    [MaxLength(200)] string? Veterinarian
);

public record VaccineRecordResponse(
    long Id,
    Guid PetId,
    string VaccineName,
    VaccineStatus Status,
    DateTimeOffset? DateAdministered,
    DateTimeOffset? NextDueDate,
    string? Notes,
    string? Veterinarian,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);
