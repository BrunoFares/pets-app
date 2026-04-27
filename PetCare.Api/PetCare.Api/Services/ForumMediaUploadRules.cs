using Microsoft.AspNetCore.Http;
using PetCare.Api.Model;

namespace PetCare.Api.Services;

public static class ForumMediaUploadRules
{
    public const int MaxAttachmentsPerPost = 4;
    public const int MaxVideosPerPost = 1;
    public const long MaxVideoBytes = 20_000_000;
    public const long MaxUploadRequestBytes = MaxVideoBytes + ((MaxAttachmentsPerPost - MaxVideosPerPost) * ImageUploadValidator.MaxImageBytes);

    private static readonly IReadOnlyDictionary<string, string> AllowedVideoTypes = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        [".mp4"] = "video/mp4",
        [".webm"] = "video/webm"
    };

    public static bool TryValidate(
        IReadOnlyCollection<IFormFile>? files,
        int existingAttachmentCount,
        int existingVideoCount,
        out string errorMessage,
        out List<ValidatedForumMediaFile> validatedFiles)
    {
        errorMessage = string.Empty;
        validatedFiles = new List<ValidatedForumMediaFile>();

        if (files is null || files.Count == 0)
        {
            errorMessage = "At least one attachment is required.";
            return false;
        }

        if (files.Count > MaxAttachmentsPerPost)
        {
            errorMessage = $"You can upload at most {MaxAttachmentsPerPost} attachments at once.";
            return false;
        }

        if (existingAttachmentCount + files.Count > MaxAttachmentsPerPost)
        {
            errorMessage = $"A maximum of {MaxAttachmentsPerPost} attachments is allowed per post.";
            return false;
        }

        var totalVideoCount = existingVideoCount;
        foreach (var file in files)
        {
            if (!TryValidateFile(file, out errorMessage, out var validatedFile))
            {
                validatedFiles.Clear();
                return false;
            }

            if (validatedFile.MediaType == ForumAttachmentMediaType.Video)
            {
                totalVideoCount++;
                if (totalVideoCount > MaxVideosPerPost)
                {
                    errorMessage = $"A maximum of {MaxVideosPerPost} video attachment is allowed per post.";
                    validatedFiles.Clear();
                    return false;
                }
            }

            validatedFiles.Add(validatedFile);
        }

        return true;
    }

    public static ForumAttachmentMediaType InferMediaTypeFromUrl(string url)
    {
        var basePath = url.Split('?', 2)[0];
        var extension = NormalizeVideoExtension(Path.GetExtension(basePath));
        return AllowedVideoTypes.ContainsKey(extension)
            ? ForumAttachmentMediaType.Video
            : ForumAttachmentMediaType.Image;
    }

    private static bool TryValidateFile(
        IFormFile? file,
        out string errorMessage,
        out ValidatedForumMediaFile validatedFile)
    {
        validatedFile = default!;
        errorMessage = string.Empty;

        if (LooksLikeVideo(file))
        {
            return TryValidateVideo(file, out errorMessage, out validatedFile);
        }

        if (ImageUploadValidator.TryValidateImage(file, out errorMessage, out var imageExtension))
        {
            validatedFile = new ValidatedForumMediaFile(file!, ForumAttachmentMediaType.Image, imageExtension, file!.Length);
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
        out ValidatedForumMediaFile validatedFile)
    {
        validatedFile = default!;
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

        validatedFile = new ValidatedForumMediaFile(file, ForumAttachmentMediaType.Video, normalizedExtension, file.Length);
        return true;
    }

    private static bool LooksLikeVideo(IFormFile? file)
    {
        if (file is null)
        {
            return false;
        }

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

    public sealed record ValidatedForumMediaFile(
        IFormFile File,
        ForumAttachmentMediaType MediaType,
        string NormalizedExtension,
        long FileSizeBytes
    );
}
