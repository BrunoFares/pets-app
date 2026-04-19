namespace PetCare.Api.Services.Email;

public class EmailSenderOptions
{
    public string SmtpHost { get; set; } = string.Empty;
    public int SmtpPort { get; set; } = 587;
    public string SmtpUsername { get; set; } = string.Empty;
    public string SmtpPassword { get; set; } = string.Empty;
    public string SenderEmail { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
    public string FrontendVerificationUrlBase { get; set; } = string.Empty;
    public int VerificationTokenHours { get; set; } = 24;
}
