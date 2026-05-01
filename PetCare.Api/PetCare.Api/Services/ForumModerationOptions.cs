namespace PetCare.Api.Services;

public sealed class ForumModerationOptions
{
    public string PythonInferenceUrl { get; set; } = "http://127.0.0.1:8010";
    public int TimeoutSeconds { get; set; } = 5;
    public bool UseRulesFallback { get; set; } = true;
    public decimal ReviewThreshold { get; set; } = 0.50m;
    public decimal AutoHideThreshold { get; set; } = 0.75m;
}
