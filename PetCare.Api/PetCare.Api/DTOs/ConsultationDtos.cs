using System.ComponentModel.DataAnnotations;

namespace PetCare.Api.DTOs;

public record CreateConsultationRequest(
    [Required] Guid PetId,
    Guid? VetPlaceId,
    [Required] DateTimeOffset Date,
    [Required, MaxLength(3000)] string Details
);

public record UpdateConsultationRequest(
    Guid? VetPlaceId,
    [Required] DateTimeOffset Date,
    [Required, MaxLength(3000)] string Details
);

public record ConsultationResponse(
    long Id,
    Guid PetId,
    Guid? VetPlaceId,
    string? VetName,
    DateTimeOffset Date,
    string Details,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt
);
