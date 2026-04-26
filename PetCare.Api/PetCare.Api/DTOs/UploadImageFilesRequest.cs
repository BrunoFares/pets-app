using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace PetCare.Api.DTOs;

public class UploadImageFilesRequest
{
    [Required]
    public List<IFormFile> Files { get; set; } = new();
}
