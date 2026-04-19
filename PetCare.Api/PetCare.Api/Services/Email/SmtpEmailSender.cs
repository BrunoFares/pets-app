using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;

namespace PetCare.Api.Services.Email;

public class SmtpEmailSender : IEmailSender
{
    private readonly EmailSenderOptions _options;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(IOptions<EmailSenderOptions> options, IWebHostEnvironment env, ILogger<SmtpEmailSender> logger)
    {
        _options = options.Value;
        _env = env;
        _logger = logger;
    }

    public async Task SendVerificationEmailAsync(string toEmail, string toName, string verificationLink, CancellationToken cancellationToken = default)
    {
        if (_env.IsDevelopment() && string.IsNullOrWhiteSpace(_options.SmtpHost))
        {
            _logger.LogInformation("Email verification link for {Email}: {VerificationLink}", toEmail, verificationLink);
            return;
        }

        using var message = new MailMessage
        {
            From = new MailAddress(_options.SenderEmail, _options.SenderName),
            Subject = "Verify your email",
            Body = BuildBody(toName, verificationLink),
            IsBodyHtml = false
        };

        message.To.Add(new MailAddress(toEmail, toName));

        using var client = new SmtpClient(_options.SmtpHost, _options.SmtpPort)
        {
            EnableSsl = true,
            Credentials = new NetworkCredential(_options.SmtpUsername, _options.SmtpPassword)
        };

        cancellationToken.ThrowIfCancellationRequested();
        await client.SendMailAsync(message, cancellationToken);
    }

    private static string BuildBody(string toName, string verificationLink)
    {
        return
$@"Hello {toName},

Please verify your email address by opening the link below:
{verificationLink}

This link expires in 24 hours.

If you did not create this account, you can ignore this email.";
    }
}
