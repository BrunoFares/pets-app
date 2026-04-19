using System.ComponentModel.DataAnnotations;

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

public record ForumPostLikeStatusResponse(
    Guid ForumPostId,
    int LikesCount,
    bool IsLikedByCurrentUser
);

public record ForumPostResponse(
    Guid Id,
    long UserId,
    string UserName,
    string Content,
    IReadOnlyList<string> Attachments,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt,
    bool IsAReply,
    Guid? ReplyingToPost,
    int RepliesCount,
    bool IsBookmarked,
    int LikesCount,
    bool IsLikedByCurrentUser
);
