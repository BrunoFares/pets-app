namespace PetCare.Api.Services;

public class PetTranslatorOptions
{
    public string? PythonExecutablePath { get; set; }
    public string? ModelScriptPath { get; set; }
    public string? ModelPath { get; set; }
    public double MinimumConfidence { get; set; } = 0.55;
    public int TimeoutSeconds { get; set; } = 30;
}
