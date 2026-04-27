using PetCare.Api.Model;

namespace PetCare.Api.Services;

public interface IForumTextModerationService
{
    Task<ForumTextModerationResult> ModerateAsync(string text, CancellationToken cancellationToken = default);
}

public sealed record ForumTextModerationResult(
    ForumAiModerationLabel Label,
    decimal Confidence,
    string? Reason
);
