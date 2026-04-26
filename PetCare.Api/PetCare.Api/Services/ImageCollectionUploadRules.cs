using Microsoft.AspNetCore.Http;

namespace PetCare.Api.Services;

public static class ImageCollectionUploadRules
{
    public const int MaxImagesPerEntity = 5;
    public const long MaxUploadRequestBytes = ImageUploadValidator.MaxImageBytes * MaxImagesPerEntity;

    public static bool TryValidate(
        IReadOnlyCollection<IFormFile>? files,
        int existingImageCount,
        out string errorMessage)
    {
        errorMessage = string.Empty;

        if (files is null || files.Count == 0)
        {
            errorMessage = "At least one image is required.";
            return false;
        }

        if (files.Count > MaxImagesPerEntity)
        {
            errorMessage = $"You can upload at most {MaxImagesPerEntity} images at once.";
            return false;
        }

        if (existingImageCount + files.Count > MaxImagesPerEntity)
        {
            errorMessage = $"A maximum of {MaxImagesPerEntity} images is allowed.";
            return false;
        }

        foreach (var file in files)
        {
            if (!ImageUploadValidator.TryValidateImage(file, out errorMessage, out _))
            {
                return false;
            }
        }

        return true;
    }
}
