using System.ComponentModel.DataAnnotations;
using PetCare.Api.Model;

namespace PetCare.Api.DTOs;

public record CreateIllnessRecordRequest(
    [Required] Guid PetId,
    [Required, MaxLength(200)] string IllnessName,
    [Required] DateTimeOffset DiagnosisDate,
    [Required] IllnessStatus Status,
    [MaxLength(2000)] string? Description,
    [MaxLength(2000)] string? Notes,
    DateTimeOffset? CuredDate
);

public record UpdateIllnessRecordRequest(
    [Required, MaxLength(200)] string IllnessName,
    [Required] DateTimeOffset DiagnosisDate,
    [Required] IllnessStatus Status,
    [MaxLength(2000)] string? Description,
    [MaxLength(2000)] string? Notes,
    DateTimeOffset? CuredDate
);

public record IllnessRecordResponse(
    long Id,
    Guid PetId,
    string IllnessName,
    DateTimeOffset DiagnosisDate,
    IllnessStatus Status,
    string? Description,
    string? Notes,
    DateTimeOffset? CuredDate,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    IReadOnlyList<long> MedicationsId
);
