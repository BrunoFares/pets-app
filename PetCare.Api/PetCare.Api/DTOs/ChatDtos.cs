using System.ComponentModel.DataAnnotations;
using PetCare.Api.Model;

namespace PetCare.Api.DTOs;

public record CreateChatRequest(List<CreateChatMessageRequest> Discussion);

public record CreateChatMessageRequest(
    [Required] ChatRole Role,
    [Required, MaxLength(5000)] string Content
);

public record AppendChatMessagesRequest(List<CreateChatMessageRequest> Messages);

public record ChatMessageResponse(long Id, ChatRole Role, string Content, DateTimeOffset CreatedAt);
public record ChatResponse(Guid Id, long UserId, IReadOnlyList<ChatMessageResponse> Discussion, DateTimeOffset CreatedAt, DateTimeOffset? UpdatedAt);
