namespace PetCare.Api.Model;

public class AppUser
{
    public long Id { get; set; }
    public string Username { get; set; } = default!;
    public string? Name { get; set; }
    public string FirstName { get; set; } = default!;
    public string LastName { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string PhoneNumber { get; set; } = default!;
    public string PasswordHash { get; set; } = default!;
    public string? AvatarUrl { get; set; }
    public string? Description { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? LastLogin { get; set; }

    public List<PetModel> Pets { get; set; } = new();
    public List<ConsultationModel> Consultations { get; set; } = new();
    public List<ForumPostModel> ForumPosts { get; set; } = new();
    public List<ForumPostBookmarkModel> BookmarkedPosts { get; set; } = new();
    public List<ChatSessionModel> Chats { get; set; } = new();
}
