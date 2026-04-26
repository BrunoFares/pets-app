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

    public async Task SendVerificationEmailAsync(string toEmail, string toName, string verificationCode, CancellationToken cancellationToken = default)
    {
        if (_env.IsDevelopment() && string.IsNullOrWhiteSpace(_options.SmtpHost))
        {
            _logger.LogInformation("Email verification code for {Email}: {VerificationCode}", toEmail, verificationCode);
            return;
        }

        using var message = new MailMessage
        {
            From = new MailAddress(_options.SenderEmail, _options.SenderName),
            Subject = "Verify your email",
            Body = BuildVerificationBody(toName, verificationCode),
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

    public async Task SendPasswordResetEmailAsync(string toEmail, string toName, string resetCode, CancellationToken cancellationToken = default)
    {
        if (_env.IsDevelopment() && string.IsNullOrWhiteSpace(_options.SmtpHost))
        {
            _logger.LogInformation("Password reset code for {Email}: {ResetCode}", toEmail, resetCode);
            return;
        }

        using var message = new MailMessage
        {
            From = new MailAddress(_options.SenderEmail, _options.SenderName),
            Subject = "Reset your password",
            Body = BuildPasswordResetBody(toName, resetCode),
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

    public async Task SendEmailChangeVerificationEmailAsync(string toEmail, string toName, string verificationCode, CancellationToken cancellationToken = default)
    {
        if (_env.IsDevelopment() && string.IsNullOrWhiteSpace(_options.SmtpHost))
        {
            _logger.LogInformation("Email change verification code for {Email}: {VerificationCode}", toEmail, verificationCode);
            return;
        }

        using var message = new MailMessage
        {
            From = new MailAddress(_options.SenderEmail, _options.SenderName),
            Subject = "Confirm your new email address",
            Body = BuildEmailChangeBody(toName, verificationCode),
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

    private string BuildVerificationBody(string toName, string verificationCode)
    {
        return
$@"Hello {toName},

Please verify your email address using this 6-digit code:
{verificationCode}

This code expires in {_options.VerificationTokenHours} hours.

If you did not create this account, you can ignore this email.";
    }

    private string BuildPasswordResetBody(string toName, string resetCode)
    {
        return
$@"Hello {toName},

We received a request to reset your password. Use this 6-digit code:
{resetCode}

This code expires in {_options.PasswordResetCodeMinutes} minutes.

If you did not request a password reset, you can ignore this email.";
    }

    private string BuildEmailChangeBody(string toName, string verificationCode)
    {
        return
$@"Hello {toName},

Use this 6-digit code to confirm your new email address:
{verificationCode}

This code expires in {_options.EmailChangeCodeHours} hours.

If you did not request this email change, you can ignore this email.";
    }
}
