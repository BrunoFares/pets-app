namespace PetCare.Api.Model;

public class ConversationModel
{
    public long Id { get; set; }
    public long ParticipantOneUserId { get; set; }
    public long ParticipantTwoUserId { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? LastMessageAt { get; set; }

    public AppUser ParticipantOneUser { get; set; } = null!;
    public AppUser ParticipantTwoUser { get; set; } = null!;
    public List<ConversationParticipantModel> Participants { get; set; } = new();
    public List<DirectMessageModel> Messages { get; set; } = new();
}
