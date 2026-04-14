using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace PetCare.Api.DTOs;

public class UploadAvatarRequest
{
    [Required]
    public IFormFile File { get; set; } = default!;
}