namespace PetCare.Api.Model;

public class ConversationParticipantModel
{
    public long ConversationId { get; set; }
    public long UserId { get; set; }
    public DateTimeOffset? LastReadAt { get; set; }

    public ConversationModel Conversation { get; set; } = null!;
    public AppUser User { get; set; } = null!;
}
