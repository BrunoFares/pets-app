using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using PetCare.Api.Model;

namespace PetCare.Api.Services;

public sealed class PythonForumTextModerationService : IForumTextModerationService
{
    private readonly HttpClient _httpClient;
    private readonly ForumModerationOptions _options;
    private readonly RulesBasedForumTextModerationService _fallback;
    private readonly ILogger<PythonForumTextModerationService> _logger;

    public PythonForumTextModerationService(
        HttpClient httpClient,
        IOptions<ForumModerationOptions> options,
        RulesBasedForumTextModerationService fallback,
        ILogger<PythonForumTextModerationService> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _fallback = fallback;
        _logger = logger;

        var baseUrl = string.IsNullOrWhiteSpace(_options.PythonInferenceUrl)
            ? "http://127.0.0.1:8010"
            : _options.PythonInferenceUrl.Trim();

        _httpClient.BaseAddress = new Uri(baseUrl.TrimEnd('/') + "/");
        _httpClient.Timeout = TimeSpan.FromSeconds(Math.Clamp(_options.TimeoutSeconds, 1, 60));
    }

    public async Task<ForumTextModerationResult> ModerateAsync(string text, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _httpClient.PostAsJsonAsync(
                "predict",
                new PythonModerationRequest(text ?? string.Empty),
                cancellationToken);

            response.EnsureSuccessStatusCode();

            var prediction = await response.Content.ReadFromJsonAsync<PythonModerationResponse>(
                cancellationToken: cancellationToken);

            if (prediction is null)
            {
                throw new InvalidOperationException("Python moderation service returned an empty response.");
            }

            if (!Enum.TryParse<ForumAiModerationLabel>(prediction.PredictedLabel, ignoreCase: true, out var label))
            {
                throw new InvalidOperationException($"Python moderation service returned unsupported label '{prediction.PredictedLabel}'.");
            }

            var confidence = ClampConfidence(prediction.Confidence);
            _logger.LogInformation(
                "Python forum moderation completed. Label: {Label} Confidence: {Confidence} TextLength: {TextLength}",
                label,
                confidence,
                string.IsNullOrWhiteSpace(text) ? 0 : text.Length);
            return new ForumTextModerationResult(
                label,
                confidence,
                BuildReason(label, confidence, prediction.Probabilities));
        }
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested && _options.UseRulesFallback)
        {
            _logger.LogWarning(ex, "Python forum moderation inference failed. Falling back to local rules-based moderation.");
            var fallbackResult = await _fallback.ModerateAsync(text, cancellationToken);
            return fallbackResult with
            {
                Reason = $"Python moderation service unavailable; rules fallback used. {fallbackResult.Reason}"
            };
        }
    }

    private static decimal ClampConfidence(decimal confidence) =>
        Math.Min(1.0m, Math.Max(0.0m, confidence));

    private static string BuildReason(
        ForumAiModerationLabel label,
        decimal confidence,
        IReadOnlyDictionary<string, decimal>? probabilities)
    {
        if (probabilities is null || probabilities.Count == 0)
        {
            return $"Baseline ML model predicted {label} with confidence {confidence:0.000}.";
        }

        var probabilitySummary = string.Join(
            ", ",
            probabilities
                .OrderByDescending(pair => pair.Value)
                .Select(pair => $"{pair.Key}={pair.Value:0.000}"));

        return $"Baseline ML model predicted {label} with confidence {confidence:0.000}. Probabilities: {probabilitySummary}.";
    }

    private sealed record PythonModerationRequest(
        [property: JsonPropertyName("text")] string Text);

    private sealed record PythonModerationResponse(
        [property: JsonPropertyName("predictedLabel")] string PredictedLabel,
        [property: JsonPropertyName("confidence")] decimal Confidence,
        [property: JsonPropertyName("probabilities")] Dictionary<string, decimal>? Probabilities);
}
