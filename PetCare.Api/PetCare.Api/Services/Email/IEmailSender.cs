namespace PetCare.Api.Services.Email;

public interface IEmailSender
{
    Task SendVerificationEmailAsync(string toEmail, string toName, string verificationLink, CancellationToken cancellationToken = default);
}
