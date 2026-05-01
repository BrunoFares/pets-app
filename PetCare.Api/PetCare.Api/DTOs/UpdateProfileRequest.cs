using System.ComponentModel.DataAnnotations;

namespace PetCare.Api.DTOs;

public class UpdateProfileRequest
{
    [MaxLength(100)]
    public string? Username { get; set; }

    [MaxLength(100)]
    public string? FirstName { get; set; }

    [MaxLength(100)]
    public string? LastName { get; set; }

    [MaxLength(1000)]
    public string? Description { get; set; }
}

public record UserProfileResponse(
    long Id,
    string Username,
    string ChatCode,
    string FirstName,
    string LastName,
    string Email,
    string? Image,
    string? Description,
    bool IsApprovedPlaceOwner,
    DateTimeOffset CreatedAt,
    DateTimeOffset? LastLogin
);

public record ChatCodeUserLookupResponse(
    long Id,
    string Username,
    string FirstName,
    string LastName,
    string? AvatarUrl,
    bool IsApprovedPlaceOwner,
    string ChatCode
);

public record ForumUserProfileResponse(
    long Id,
    string Name,
    string? Image,
    string? Description
);
