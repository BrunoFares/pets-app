namespace PetCare.Api.DTOs;

public record AnalyzePetAudioResponse(
    string Label,
    double Confidence,
    IReadOnlyDictionary<string, double> Probabilities,
    bool TranslationAvailable,
    string Message
);
