using Microsoft.AspNetCore.Http;

namespace PetCare.Api.Services;

public static class LocalImageStorage
{
    public static async Task<string> SaveFileAsync(
        IWebHostEnvironment env,
        IFormFile file,
        string fileNamePrefix,
        string normalizedExtension,
        params string[] relativeSegments)
    {
        var webRoot = env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        Directory.CreateDirectory(webRoot);

        var uploadsRoot = Path.Combine(webRoot, "uploads");
        Directory.CreateDirectory(uploadsRoot);

        var targetDirectory = relativeSegments.Aggregate(uploadsRoot, Path.Combine);
        Directory.CreateDirectory(targetDirectory);

        var fileName = $"{fileNamePrefix}-{Guid.NewGuid():N}{normalizedExtension}";
        var fullPath = Path.Combine(targetDirectory, fileName);

        await using (var stream = System.IO.File.Create(fullPath))
        {
            await file.CopyToAsync(stream);
        }

        var relativePath = new[] { "uploads" }
            .Concat(relativeSegments)
            .Concat(new[] { fileName });

        return "/" + string.Join("/", relativePath);
    }

    public static async Task<string> SaveImageAsync(
        IWebHostEnvironment env,
        IFormFile file,
        string fileNamePrefix,
        string normalizedExtension,
        params string[] relativeSegments)
    {
        return await SaveFileAsync(env, file, fileNamePrefix, normalizedExtension, relativeSegments);
    }

    public static void TryDeleteFile(IWebHostEnvironment env, string? storedPath)
    {
        if (string.IsNullOrWhiteSpace(storedPath))
        {
            return;
        }

        var basePath = storedPath.Split('?', 2)[0].TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
        var webRoot = env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var fullPath = Path.Combine(webRoot, basePath);

        if (System.IO.File.Exists(fullPath))
        {
            System.IO.File.Delete(fullPath);
        }
    }
}
