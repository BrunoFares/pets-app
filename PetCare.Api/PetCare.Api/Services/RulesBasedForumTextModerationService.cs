using System.Text.RegularExpressions;
using PetCare.Api.Model;

namespace PetCare.Api.Services;

public sealed class RulesBasedForumTextModerationService : IForumTextModerationService
{
    private static readonly Regex UrlRegex = new(@"https?://|www\.", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly string[] SpamPhrases =
    [
        "buy now",
        "click here",
        "discount",
        "free money",
        "limited offer",
        "promo code",
        "telegram",
        "whatsapp"
    ];

    private static readonly string[] AbusivePhrases =
    [
        "kill yourself",
        "hate you",
        "shut up",
        "idiot",
        "moron",
        "stupid"
    ];

    private static readonly string[] SuspiciousPhrases =
    [
        "bank account",
        "cashapp",
        "crypto",
        "dm me",
        "investment",
        "password",
        "send money",
        "western union"
    ];

    public Task<ForumTextModerationResult> ModerateAsync(string text, CancellationToken cancellationToken = default)
    {
        var normalized = (text ?? string.Empty).Trim().ToLowerInvariant();
        if (normalized.Length == 0)
        {
            return Task.FromResult(new ForumTextModerationResult(
                ForumAiModerationLabel.Safe,
                0.99m,
                "No text to moderate."));
        }

        var spamHits = CountPhraseHits(normalized, SpamPhrases) + (UrlRegex.IsMatch(normalized) ? 1 : 0);
        var abusiveHits = CountPhraseHits(normalized, AbusivePhrases);
        var suspiciousHits = CountPhraseHits(normalized, SuspiciousPhrases);

        if (abusiveHits > 0)
        {
            return Task.FromResult(new ForumTextModerationResult(
                ForumAiModerationLabel.Abusive,
                ConfidenceFromHits(abusiveHits),
                "Matched abusive or hostile language patterns."));
        }

        if (spamHits > 0)
        {
            return Task.FromResult(new ForumTextModerationResult(
                ForumAiModerationLabel.Spam,
                ConfidenceFromHits(spamHits),
                "Matched promotional, link, or spam-like language patterns."));
        }

        if (suspiciousHits > 0)
        {
            return Task.FromResult(new ForumTextModerationResult(
                ForumAiModerationLabel.Suspicious,
                Math.Min(0.90m, 0.62m + suspiciousHits * 0.08m),
                "Matched suspicious solicitation or sensitive-information patterns."));
        }

        return Task.FromResult(new ForumTextModerationResult(
            ForumAiModerationLabel.Safe,
            0.97m,
            "No configured moderation patterns matched."));
    }

    private static int CountPhraseHits(string normalizedText, IReadOnlyCollection<string> phrases) =>
        phrases.Count(phrase => normalizedText.Contains(phrase, StringComparison.Ordinal));

    private static decimal ConfidenceFromHits(int hits) =>
        Math.Min(0.99m, 0.72m + hits * 0.12m);
}
