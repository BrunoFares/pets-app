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
    public ForumAiModerationLabel? AiModerationLabel { get; set; }
    public decimal? AiModerationConfidence { get; set; }
    public string? AiModerationReason { get; set; }
    public ForumModerationStatus ModerationStatus { get; set; } = ForumModerationStatus.None;
    public DateTimeOffset? ModeratedAt { get; set; }
    public ForumModerationLabel? FinalModerationLabel { get; set; }
    public long? ReviewedByAdminId { get; set; }
    public DateTimeOffset? ReviewedAt { get; set; }
    public string? AdminModerationNotes { get; set; }

    public AppUser User { get; set; } = null!;
    public AdminUser? ReviewedByAdmin { get; set; }
    public ForumPostModel? ReplyingToPost { get; set; }
    public List<ForumPostModel> Replies { get; set; } = new();
    public List<ForumPostAttachmentModel> Attachments { get; set; } = new();
    public List<ForumPostBookmarkModel> Bookmarks { get; set; } = new();
    public List<ForumPostLikeModel> Likes { get; set; } = new();
}
