using Microsoft.AspNetCore.Http;

namespace PetCare.Api.Services;

public static class ImageUploadValidator
{
    public const long MaxImageBytes = 5_000_000;

    private static readonly IReadOnlyDictionary<string, string> AllowedTypes = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        [".jpg"] = "image/jpeg",
        [".jpeg"] = "image/jpeg",
        [".png"] = "image/png",
        [".webp"] = "image/webp"
    };

    public static bool TryValidateImage(IFormFile? file, out string errorMessage, out string normalizedExtension)
    {
        errorMessage = string.Empty;
        normalizedExtension = string.Empty;

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

        if (file.Length > MaxImageBytes)
        {
            errorMessage = $"File is too large. Maximum allowed size is {MaxImageBytes / 1_000_000} MB.";
            return false;
        }

        normalizedExtension = NormalizeExtension(Path.GetExtension(file.FileName));
        if (string.IsNullOrWhiteSpace(normalizedExtension))
        {
            if (!TryGetExtensionFromContentType(file.ContentType, out normalizedExtension))
            {
                errorMessage = "Only JPG, PNG, and WEBP images are allowed.";
                return false;
            }
        }

        if (!AllowedTypes.TryGetValue(normalizedExtension, out var expectedContentType))
        {
            errorMessage = "Only JPG, PNG, and WEBP images are allowed.";
            return false;
        }

        if (string.IsNullOrWhiteSpace(file.ContentType) || !string.Equals(file.ContentType, expectedContentType, StringComparison.OrdinalIgnoreCase))
        {
            errorMessage = "The uploaded file content type does not match the file extension.";
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
            ".jpeg" => ".jpg",
            var value => value
        };
    }

    private static bool TryGetExtensionFromContentType(string? contentType, out string extension)
    {
        extension = contentType?.Trim().ToLowerInvariant() switch
        {
            "image/jpeg" => ".jpg",
            "image/png" => ".png",
            "image/webp" => ".webp",
            _ => string.Empty
        };

        return extension.Length > 0;
    }
}
