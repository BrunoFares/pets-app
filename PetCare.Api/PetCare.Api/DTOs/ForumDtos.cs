using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;
using PetCare.Api.Model;

namespace PetCare.Api.DTOs;

public record CreateForumPostRequest(
    [Required, MaxLength(5000)] string Content,
    List<string>? Attachments
);

public record ReplyToForumPostRequest(
    [Required, MaxLength(5000)] string Content,
    List<string>? Attachments
);

public record UpdateForumPostRequest([Required, MaxLength(5000)] string Content);

public class UploadForumMediaFilesRequest
{
    [Required]
    public List<IFormFile> Files { get; set; } = new();
}

public record ForumPostAttachmentResponse(
    long Id,
    string Url,
    ForumAttachmentMediaType MediaType,
    long FileSizeBytes,
    DateTimeOffset CreatedAt
);

public record ForumPostLikeStatusResponse(
    Guid ForumPostId,
    int LikesCount,
    bool IsLikedByCurrentUser
);

// `IsBookmarked` is kept as a legacy alias for client compatibility.
// Newer clients should prefer `IsBookmarkedByCurrentUser`.
public record ForumPostResponse(
    Guid Id,
    long UserId,
    string UserName,
    string? UserImage,
    string Content,
    IReadOnlyList<ForumPostAttachmentResponse> Attachments,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt,
    bool IsAReply,
    Guid? ReplyingToPost,
    int RepliesCount,
    bool IsBookmarked,
    bool IsBookmarkedByCurrentUser,
    int BookmarksCount,
    int LikesCount,
    bool IsLikedByCurrentUser
);

public record ForumPostListResponse(
    IReadOnlyList<ForumPostResponse> Items,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages
);
