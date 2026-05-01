namespace PetCare.Api.Model;

public class DirectMessageModel
{
    public long Id { get; set; }
    public long ConversationId { get; set; }
    public long SenderUserId { get; set; }
    public string Content { get; set; } = default!;
    public string? MediaUrl { get; set; }
    public DirectMessageMediaType? MediaType { get; set; }
    public long? MediaSizeBytes { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ConversationModel Conversation { get; set; } = null!;
    public AppUser SenderUser { get; set; } = null!;
}
