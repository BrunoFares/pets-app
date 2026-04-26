using System.ComponentModel.DataAnnotations;

namespace PetCare.Api.DTOs;

public record ChangePasswordRequest(
    [Required] string CurrentPassword,
    [Required, StringLength(64, MinimumLength = 8)] string NewPassword,
    [Required] string ConfirmNewPassword
);

public record ForgotPasswordRequest(
    [Required, EmailAddress, MaxLength(320)] string Email
);

public record ResetPasswordRequest(
    [Required, EmailAddress, MaxLength(320)] string Email,
    [Required] string Code,
    [Required, StringLength(64, MinimumLength = 8)] string NewPassword,
    [Required] string ConfirmNewPassword
);

public record RequestEmailChangeRequest(
    [Required, EmailAddress, MaxLength(320)] string NewEmail,
    [Required] string CurrentPassword
);

public record ConfirmEmailChangeRequest(
    [Required] string Code
);
