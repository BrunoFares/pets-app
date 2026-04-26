using System.ComponentModel.DataAnnotations;
using PetCare.Api.Model;

namespace PetCare.Api.DTOs;

public record AdminLoginRequest(
    [Required, MaxLength(320)] string Email,
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

public record ChangeAdminPasswordRequest(
    [Required] string CurrentPassword,
    [Required, StringLength(64, MinimumLength = 8)] string NewPassword,
    [Required] string ConfirmNewPassword
);

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

public record ResetAdminUserPasswordRequest(
    [Required, StringLength(64, MinimumLength = 8)] string NewPassword,
    [Required] string ConfirmNewPassword,
    [MaxLength(1000)] string? Reason
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

public record RevokePlaceOwnerApprovalRequest(
    [MaxLength(1000)] string? Reason,
    [MaxLength(1000)] string? AdminNotes
);

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

public record AdminUserSearchListResponse(
    IReadOnlyList<ModeratedUserListItemResponse> Items,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages
);

public record AdminForumPostListItemResponse(
    Guid Id,
    long UserId,
    string UserName,
    string? UserImage,
    string Content,
    IReadOnlyList<ForumPostAttachmentResponse> Attachments,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt,
    bool IsAReply,
    Guid? ReplyingToPostId,
    int RepliesCount,
    int LikesCount
);

public record AdminForumPostSearchListResponse(
    IReadOnlyList<AdminForumPostListItemResponse> Items,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages
);

public record AdminActionLogResponse(
    long Id,
    long AdminUserId,
    string AdminUsername,
    string ActionType,
    string TargetType,
    string TargetId,
    string Description,
    string? Reason,
    DateTimeOffset CreatedAt
);

public record AdminActionLogListResponse(
    IReadOnlyList<AdminActionLogResponse> Items,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages
);
