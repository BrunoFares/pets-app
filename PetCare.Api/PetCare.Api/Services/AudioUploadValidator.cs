using Microsoft.AspNetCore.Http;

namespace PetCare.Api.Services;

public static class AudioUploadValidator
{
    public const long MaxAudioBytes = 15_000_000;

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".wav",
        ".mp3",
        ".m4a",
        ".aac",
        ".ogg",
        ".oga",
        ".webm",
        ".3gp",
        ".mp4"
    };

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "audio/wav",
        "audio/x-wav",
        "audio/wave",
        "audio/mpeg",
        "audio/mp4",
        "audio/x-m4a",
        "audio/aac",
        "audio/ogg",
        "audio/webm",
        "audio/3gpp",
        "video/mp4",
        "application/octet-stream"
    };

    public static bool TryValidateAudio(IFormFile? file, out string errorMessage, out string normalizedExtension)
    {
        errorMessage = string.Empty;
        normalizedExtension = string.Empty;

        if (file is null)
        {
            errorMessage = "No audio file uploaded.";
            return false;
        }

        if (file.Length <= 0)
        {
            errorMessage = "The uploaded audio file is empty.";
            return false;
        }

        if (file.Length > MaxAudioBytes)
        {
            errorMessage = $"Audio file is too large. Maximum allowed size is {MaxAudioBytes / 1_000_000} MB.";
            return false;
        }

        normalizedExtension = NormalizeExtension(Path.GetExtension(file.FileName));
        if (string.IsNullOrWhiteSpace(normalizedExtension))
        {
            errorMessage = "Only WAV, MP3, M4A, AAC, OGG, WEBM, 3GP, and MP4 audio files are allowed.";
            return false;
        }

        if (!AllowedExtensions.Contains(normalizedExtension))
        {
            errorMessage = "Only WAV, MP3, M4A, AAC, OGG, WEBM, 3GP, and MP4 audio files are allowed.";
            return false;
        }

        if (!string.IsNullOrWhiteSpace(file.ContentType) && !AllowedContentTypes.Contains(file.ContentType.Trim()))
        {
            errorMessage = "The uploaded audio format is not supported.";
            return false;
        }

        return true;
    }

    private static string NormalizeExtension(string extension)
    {
        if (string.IsNullOrWhiteSpace(extension))
        {
            return string.Empty;
        }

        return extension.Trim().ToLowerInvariant() switch
        {
            ".mpeg" => ".mp3",
            ".oga" => ".ogg",
            var value => value
        };
    }
}
