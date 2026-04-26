namespace PetCare.Api.Model;

public class UserBlockModel
{
    public long BlockerUserId { get; set; }
    public long BlockedUserId { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public AppUser BlockerUser { get; set; } = null!;
    public AppUser BlockedUser { get; set; } = null!;
}
