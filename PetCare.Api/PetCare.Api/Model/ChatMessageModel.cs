namespace PetCare.Api.Model;

public class ChatMessageModel
{
    public long Id { get; set; }
    public Guid ChatSessionId { get; set; }
    public ChatRole Role { get; set; }
    public string Content { get; set; } = default!;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ChatSessionModel ChatSession { get; set; } = null!;
}
