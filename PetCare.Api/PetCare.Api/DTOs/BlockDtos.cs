namespace PetCare.Api.DTOs;

public record BlockedUserResponse(
    long Id,
    string Username,
    string FirstName,
    string LastName,
    string? AvatarUrl,
    DateTimeOffset BlockedAt
);
