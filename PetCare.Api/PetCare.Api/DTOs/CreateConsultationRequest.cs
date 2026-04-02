using System.ComponentModel.DataAnnotations;

namespace PetCare.Api.DTOs;

public record CreateConsultationRequest(
    [Required] Guid PetId,
    [Required] string VetId,
    [Required] DateTimeOffset Date,
    [Required] string Details
);