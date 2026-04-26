namespace PetCare.Api.Model;

public class ForumPostAttachmentModel
{
    public long Id { get; set; }
    public Guid ForumPostId { get; set; }
    public string Url { get; set; } = default!;
    public ForumAttachmentMediaType MediaType { get; set; }
    public long FileSizeBytes { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ForumPostModel ForumPost { get; set; } = null!;
}
