namespace PetCare.Api.Model;

public class ForumPostModel
{
    public Guid Id { get; set; }
    public long UserId { get; set; }
    public string Content { get; set; } = default!;
    public bool IsAReply { get; set; }
    public Guid? ReplyingToPostId { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAt { get; set; }

    public AppUser User { get; set; } = null!;
    public ForumPostModel? ReplyingToPost { get; set; }
    public List<ForumPostModel> Replies { get; set; } = new();
    public List<ForumPostAttachmentModel> Attachments { get; set; } = new();
    public List<ForumPostBookmarkModel> Bookmarks { get; set; } = new();
    public List<ForumPostLikeModel> Likes { get; set; } = new();
}
