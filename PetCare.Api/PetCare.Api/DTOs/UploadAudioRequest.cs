using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace PetCare.Api.DTOs;

public class UploadAudioRequest
{
    [Required]
    public IFormFile File { get; set; } = default!;
}
