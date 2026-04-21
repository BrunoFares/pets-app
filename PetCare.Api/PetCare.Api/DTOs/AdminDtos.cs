using System.ComponentModel.DataAnnotations;
using PetCare.Api.Model;

namespace PetCare.Api.DTOs;

public record AdminLoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password
);

public record AdminAuthResponse(
    long AdminId,
    string AccessToken,
    AdminRole Role
);

public class UpdateAdminProfileRequest
{
    [MaxLength(100)]
    public string? Username { get; set; }

    [EmailAddress, MaxLength(320)]
    public string? Email { get; set; }

    [MaxLength(100)]
    public string? FirstName { get; set; }

    [MaxLength(100)]
    public string? LastName { get; set; }
}

public record AdminProfileResponse(
    long Id,
    string Username,
    string FirstName,
    string LastName,
    string Email,
    AdminRole Role,
    bool IsActive,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    DateTimeOffset? LastLogin
);

public record CreateAdminUserRequest(
    [Required, MaxLength(100)] string Username,
    [Required, MaxLength(100)] string FirstName,
    [Required, MaxLength(100)] string LastName,
    [Required, EmailAddress, MaxLength(320)] string Email,
    [Required, StringLength(64, MinimumLength = 8)] string Password,
    [Required] AdminRole Role
);

public record UpdateAdminUserRequest(
    [Required, MaxLength(100)] string Username,
    [Required, MaxLength(100)] string FirstName,
    [Required, MaxLength(100)] string LastName,
    [Required, EmailAddress, MaxLength(320)] string Email,
    [Required] AdminRole Role,
    bool IsActive
);

public record AdminUserListItemResponse(
    long Id,
    string Username,
    string FirstName,
    string LastName,
    string Email,
    AdminRole Role,
    bool IsActive,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    DateTimeOffset? LastLogin
);

public record AdminUserDetailsResponse(
    long Id,
    string Username,
    string FirstName,
    string LastName,
    string Email,
    AdminRole Role,
    bool IsActive,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    DateTimeOffset? LastLogin
);

public record BanUserRequest([MaxLength(500)] string? Reason);

public record ModeratedUserListItemResponse(
    long Id,
    string Username,
    string FirstName,
    string LastName,
    string Email,
    bool EmailVerified,
    bool IsBanned,
    DateTimeOffset? BannedAt,
    DateTimeOffset CreatedAt,
    DateTimeOffset? LastLogin
);

public record ModeratedUserDetailsResponse(
    long Id,
    string Username,
    string FirstName,
    string LastName,
    string Email,
    string? AvatarUrl,
    string? Description,
    bool EmailVerified,
    bool IsBanned,
    DateTimeOffset? BannedAt,
    string? BanReason,
    DateTimeOffset CreatedAt,
    DateTimeOffset? LastLogin
);
