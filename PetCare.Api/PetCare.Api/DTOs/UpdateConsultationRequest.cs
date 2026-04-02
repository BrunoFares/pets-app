using System.ComponentModel.DataAnnotations;

namespace PetCare.Api.DTOs;

public record UpdateConsultationRequest(
    [Required] string VetId,
    [Required] DateTimeOffset Date,
    [Required] string Details
);