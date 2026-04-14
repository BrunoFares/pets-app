namespace PetCare.Api.Model;

public class ChatSessionModel
{
    public Guid Id { get; set; }
    public long UserId { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAt { get; set; }

    public AppUser User { get; set; } = null!;
    public List<ChatMessageModel> Messages { get; set; } = new();
}
