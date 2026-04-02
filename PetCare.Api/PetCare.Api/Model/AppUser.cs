namespace PetCare.Api.Model;

public class AppUser
{
    public long Id { get; set; }
    public string Username { get; set; } = default!;
    public string Email { get; set; } = default!;   // stored lowercased
    public string PhoneNumber { get; set; } = default!;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? LastLogin { get; set; }
    public string FirstName { get; set; } = default!;
    public string LastName { get; set; } = default!;
    public string PasswordHash { get; set; } = default!;
    public string? AvatarUrl { get; set; }
}
