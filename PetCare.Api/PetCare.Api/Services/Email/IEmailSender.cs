namespace PetCare.Api.Services.Email;

public interface IEmailSender
{
    Task SendVerificationEmailAsync(string toEmail, string toName, string verificationCode, CancellationToken cancellationToken = default);
    Task SendPasswordResetEmailAsync(string toEmail, string toName, string resetCode, CancellationToken cancellationToken = default);
    Task SendEmailChangeVerificationEmailAsync(string toEmail, string toName, string verificationCode, CancellationToken cancellationToken = default);
}
