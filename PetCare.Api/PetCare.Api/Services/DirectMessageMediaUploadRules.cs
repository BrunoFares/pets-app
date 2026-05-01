using Microsoft.AspNetCore.Http;
using PetCare.Api.Model;

namespace PetCare.Api.Services;

public static class DirectMessageMediaUploadRules
{
    public const int MaxMediaFilesPerMessage = 1;
    public const long MaxVideoBytes = 20_000_000;
    public const long MaxUploadRequestBytes = MaxVideoBytes + 1_000_000;

    private static readonly IReadOnlyDictionary<string, string> AllowedVideoTypes = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        [".mp4"] = "video/mp4",
        [".webm"] = "video/webm"
    };

    public static bool TryValidate(
        IFormFile? file,
        out string errorMessage,
        out ValidatedDirectMessageMediaFile? validatedFile)
    {
        errorMessage = string.Empty;
        validatedFile = null;

        if (file is null)
        {
            return true;
        }

        if (LooksLikeVideo(file))
        {
            return TryValidateVideo(file, out errorMessage, out validatedFile);
        }

        if (ImageUploadValidator.TryValidateImage(file, out errorMessage, out var imageExtension))
        {
            validatedFile = new ValidatedDirectMessageMediaFile(
                file,
                DirectMessageMediaType.Image,
                imageExtension,
                file.Length);
            return true;
        }

        if (TryValidateVideo(file, out errorMessage, out validatedFile))
        {
            return true;
        }

        errorMessage = "Only JPG, PNG, WEBP images and MP4 or WEBM videos are allowed.";
        return false;
    }

    private static bool TryValidateVideo(
        IFormFile? file,
        out string errorMessage,
        out ValidatedDirectMessageMediaFile? validatedFile)
    {
        validatedFile = null;
        errorMessage = string.Empty;

        if (file is null)
        {
            errorMessage = "No file uploaded.";
            return false;
        }

        if (file.Length <= 0)
        {
            errorMessage = "The uploaded file is empty.";
            return false;
        }

        if (file.Length > MaxVideoBytes)
        {
            errorMessage = $"Video file is too large. Maximum allowed size is {MaxVideoBytes / 1_000_000} MB.";
            return false;
        }

        var normalizedExtension = NormalizeVideoExtension(Path.GetExtension(file.FileName));
        if (string.IsNullOrWhiteSpace(normalizedExtension))
        {
            if (!TryGetVideoExtensionFromContentType(file.ContentType, out normalizedExtension))
            {
                errorMessage = "Only MP4 and WEBM videos are allowed.";
                return false;
            }
        }

        if (!AllowedVideoTypes.TryGetValue(normalizedExtension, out var expectedContentType))
        {
            errorMessage = "Only MP4 and WEBM videos are allowed.";
            return false;
        }

        if (string.IsNullOrWhiteSpace(file.ContentType) ||
            !string.Equals(file.ContentType.Trim(), expectedContentType, StringComparison.OrdinalIgnoreCase))
        {
            errorMessage = "The uploaded video content type does not match the file extension.";
            return false;
        }

        validatedFile = new ValidatedDirectMessageMediaFile(
            file,
            DirectMessageMediaType.Video,
            normalizedExtension,
            file.Length);
        return true;
    }

    private static bool LooksLikeVideo(IFormFile file)
    {
        var extension = NormalizeVideoExtension(Path.GetExtension(file.FileName));
        if (AllowedVideoTypes.ContainsKey(extension))
        {
            return true;
        }

        return TryGetVideoExtensionFromContentType(file.ContentType, out _);
    }

    private static string NormalizeVideoExtension(string extension)
    {
        if (string.IsNullOrWhiteSpace(extension))
        {
            return string.Empty;
        }

        return extension.Trim().ToLowerInvariant();
    }

    private static bool TryGetVideoExtensionFromContentType(string? contentType, out string extension)
    {
        extension = contentType?.Trim().ToLowerInvariant() switch
        {
            "video/mp4" => ".mp4",
            "video/webm" => ".webm",
            _ => string.Empty
        };

        return extension.Length > 0;
    }

    public sealed record ValidatedDirectMessageMediaFile(
        IFormFile File,
        DirectMessageMediaType MediaType,
        string NormalizedExtension,
        long FileSizeBytes
    );
}
