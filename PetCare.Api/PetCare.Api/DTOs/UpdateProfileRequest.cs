using System.ComponentModel.DataAnnotations;

namespace PetCare.Api.DTOs;

public class UpdateProfileRequest
{
    [MaxLength(200)]
    public string? Name { get; set; }

    [MaxLength(100)]
    public string? FirstName { get; set; }

    [MaxLength(100)]
    public string? LastName { get; set; }

    [MaxLength(50)]
    public string? PhoneNumber { get; set; }

    [MaxLength(1000)]
    public string? Description { get; set; }
}

public record UserProfileResponse(
    long Id,
    string Username,
    string? Name,
    string FirstName,
    string LastName,
    string Email,
    string PhoneNumber,
    string? Image,
    string? Description,
    DateTimeOffset CreatedAt,
    DateTimeOffset? LastLogin
);
