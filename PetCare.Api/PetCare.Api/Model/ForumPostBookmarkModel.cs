namespace PetCare.Api.Model;

public class ForumPostBookmarkModel
{
    public long UserId { get; set; }
    public Guid ForumPostId { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public AppUser User { get; set; } = null!;
    public ForumPostModel ForumPost { get; set; } = null!;
}
