using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;
using PetCare.Api.Model;

namespace PetCare.Api.DTOs;

public record SendDirectMessageRequest(
    [Required, MaxLength(5000)] string Content
);

public class SendDirectMessageFormRequest
{
    [MaxLength(5000)]
    public string? Content { get; set; }

    public IFormFile? File { get; set; }
}

public record DirectMessageUserResponse(
    long Id,
    string Username,
    string FirstName,
    string LastName,
    string DisplayName,
    string? AvatarUrl,
    bool IsApprovedPlaceOwner
);

public record DirectMessageResponse(
    long Id,
    long ConversationId,
    long SenderUserId,
    string Content,
    string? MediaUrl,
    DirectMessageMediaType? MediaType,
    long? MediaSizeBytes,
    DateTimeOffset CreatedAt
);

public record ConversationSummaryResponse(
    long Id,
    DirectMessageUserResponse OtherParticipant,
    string? LastMessagePreview,
    DateTimeOffset? LastMessageAt,
    int UnreadCount,
    DateTimeOffset CreatedAt
);

public record ConversationDetailResponse(
    long Id,
    DirectMessageUserResponse OtherParticipant,
    DateTimeOffset CreatedAt,
    DateTimeOffset? LastMessageAt,
    DateTimeOffset? LastReadAt,
    IReadOnlyList<DirectMessageResponse> Messages
);

public record MarkConversationReadResponse(
    long ConversationId,
    DateTimeOffset LastReadAt
);
