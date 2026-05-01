using System.Diagnostics;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;

namespace PetCare.Api.Services;

public sealed class PetTranslatorService
{
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<PetTranslatorService> _logger;
    private readonly PetTranslatorOptions _options;

    public PetTranslatorService(
        IWebHostEnvironment env,
        ILogger<PetTranslatorService> logger,
        IOptions<PetTranslatorOptions> options)
    {
        _env = env;
        _logger = logger;
        _options = options.Value;
    }

    public async Task<PetTranslatorAnalysisResult> AnalyzeAsync(
        string audioFilePath,
        CancellationToken cancellationToken = default)
    {
        var pythonExecutablePath = ResolvePythonExecutablePath();
        var modelScriptPath = ResolveModelScriptPath();
        var modelPath = ResolveModelPath();
        string? normalizedAudioFilePath = null;
        var audioFileInfo = new FileInfo(audioFilePath);

        if (!File.Exists(audioFilePath))
        {
            throw new PetTranslatorInferenceException("The uploaded audio file could not be found for analysis.");
        }

        if (!CanLaunchExecutable(pythonExecutablePath))
        {
            throw new PetTranslatorConfigurationException(
                $"The pet translator Python runtime was not found at '{pythonExecutablePath}'.");
        }

        if (!File.Exists(modelScriptPath))
        {
            throw new PetTranslatorConfigurationException(
                $"The pet translator script was not found at '{modelScriptPath}'.");
        }

        if (!File.Exists(modelPath))
        {
            throw new PetTranslatorConfigurationException(
                $"The pet translator model file was not found at '{modelPath}'.");
        }

        _logger.LogInformation(
            "Pet translator inference starting. AudioPath: {AudioPath} SizeBytes: {SizeBytes} PythonExecutablePath: {PythonExecutablePath} ModelScriptPath: {ModelScriptPath} ModelPath: {ModelPath} MinimumConfidence: {MinimumConfidence}",
            audioFilePath,
            audioFileInfo.Length,
            pythonExecutablePath,
            modelScriptPath,
            modelPath,
            _options.MinimumConfidence);

        try
        {
            try
            {
                normalizedAudioFilePath = await TryConvertToWavAsync(audioFilePath, cancellationToken);
            }
            catch (Exception ex)
            {
                throw new PetTranslatorInferenceException(
                    "The uploaded audio file could not be prepared for analysis.",
                    ex);
            }

            var inferenceAudioFilePath = normalizedAudioFilePath ?? audioFilePath;

            _logger.LogInformation(
                "Pet translator audio prepared. SourcePath: {AudioPath} InferencePath: {InferenceAudioPath} UsedNormalizedCopy: {UsedNormalizedCopy}",
                audioFilePath,
                inferenceAudioFilePath,
                normalizedAudioFilePath is not null);

            using var process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = pythonExecutablePath,
                    WorkingDirectory = _env.ContentRootPath,
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    CreateNoWindow = true
                }
            };

            process.StartInfo.ArgumentList.Add(modelScriptPath);
            process.StartInfo.ArgumentList.Add("--audio");
            process.StartInfo.ArgumentList.Add(inferenceAudioFilePath);
            process.StartInfo.ArgumentList.Add("--model");
            process.StartInfo.ArgumentList.Add(modelPath);
            process.StartInfo.ArgumentList.Add("--minimum-confidence");
            process.StartInfo.ArgumentList.Add(
                _options.MinimumConfidence.ToString(System.Globalization.CultureInfo.InvariantCulture));

            try
            {
                process.Start();
            }
            catch (Exception ex)
            {
                throw new PetTranslatorConfigurationException(
                    $"The pet translator process could not be started with '{pythonExecutablePath}'.",
                    ex);
            }

            var stdoutTask = process.StandardOutput.ReadToEndAsync(cancellationToken);
            var stderrTask = process.StandardError.ReadToEndAsync(cancellationToken);

            using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeoutCts.CancelAfter(TimeSpan.FromSeconds(Math.Max(5, _options.TimeoutSeconds)));

            try
            {
                await process.WaitForExitAsync(timeoutCts.Token);
            }
            catch (OperationCanceledException ex) when (!cancellationToken.IsCancellationRequested)
            {
                TryKill(process);
                throw new PetTranslatorInferenceException(
                    "The pet translator model took too long to respond.",
                    ex);
            }

            var stdout = (await stdoutTask).Trim();
            var stderr = (await stderrTask).Trim();

            if (!string.IsNullOrWhiteSpace(stderr))
            {
                _logger.LogDebug("Pet translator stderr: {Stderr}", stderr);
            }

            if (process.ExitCode != 0)
            {
                throw new PetTranslatorInferenceException(
                    string.IsNullOrWhiteSpace(stderr)
                        ? "The pet translator model failed to analyze the audio."
                        : stderr);
            }

            if (string.IsNullOrWhiteSpace(stdout))
            {
                throw new PetTranslatorInferenceException(
                    "The pet translator model returned an empty response.");
            }

            PetTranslatorPythonResponse? response;

            try
            {
                response = JsonSerializer.Deserialize<PetTranslatorPythonResponse>(
                    stdout,
                    new JsonSerializerOptions(JsonSerializerDefaults.Web));
            }
            catch (JsonException ex)
            {
                throw new PetTranslatorInferenceException(
                    $"The pet translator model returned invalid JSON: {stdout}",
                    ex);
            }

            if (response is null || string.IsNullOrWhiteSpace(response.Label))
            {
                throw new PetTranslatorInferenceException(
                    "The pet translator model response was incomplete.");
            }

            var rawLabel = NormalizeLabel(response.RawLabel ?? response.Label);
            var label = NormalizeLabel(response.Label);
            var probabilities = new Dictionary<string, double>(StringComparer.OrdinalIgnoreCase);
            foreach (var pair in response.Probabilities)
            {
                probabilities[NormalizeLabel(pair.Key)] = pair.Value;
            }
            var thresholdApplied = !string.Equals(label, rawLabel, StringComparison.OrdinalIgnoreCase);

            _logger.LogInformation(
                "Pet translator inference parsed. FinalLabel: {Label} RawLabel: {RawLabel} Confidence: {Confidence} ThresholdApplied: {ThresholdApplied} Probabilities: {@Probabilities}",
                label,
                rawLabel,
                response.Confidence,
                thresholdApplied,
                probabilities);

            return new PetTranslatorAnalysisResult(
                label,
                response.Confidence,
                probabilities);
        }
        finally
        {
            if (!string.IsNullOrWhiteSpace(normalizedAudioFilePath))
            {
                TryDeleteFile(normalizedAudioFilePath);
            }
        }
    }

    private string ResolvePythonExecutablePath()
    {
        if (!string.IsNullOrWhiteSpace(_options.PythonExecutablePath))
        {
            return ResolveConfiguredExecutablePath(_options.PythonExecutablePath);
        }

        var candidates = GetDefaultPythonExecutableCandidates().ToArray();
        return GetFirstExistingPathOrFallback(candidates);
    }

    private string ResolveModelScriptPath()
    {
        if (!string.IsNullOrWhiteSpace(_options.ModelScriptPath))
        {
            return ResolveConfiguredPath(_options.ModelScriptPath);
        }

        return Path.Combine(ResolveMlAssetsRoot(), "predict_pet_audio.py");
    }

    private string ResolveModelPath()
    {
        if (!string.IsNullOrWhiteSpace(_options.ModelPath))
        {
            return ResolveConfiguredPath(_options.ModelPath);
        }

        var candidates = new[]
        {
            Path.Combine(ResolveMlAssetsRoot(), "models", "best_model.pth"),
            Path.Combine(ResolveMlAssetsRoot(), "models", "reference_model.json"),
            Path.Combine(ResolveLegacyAudioMlRoot(), "models", "best_model.pth")
        };

        return GetFirstExistingPathOrFallback(candidates);
    }

    private string ResolveMlAssetsRoot() =>
        Path.Combine(_env.ContentRootPath, "ML");

    private string ResolveLegacyAudioMlRoot() =>
        Path.GetFullPath(Path.Combine(_env.ContentRootPath, "..", "..", "..", "audio-ml"));

    private IEnumerable<string> GetDefaultPythonExecutableCandidates()
    {
        var localMlRoot = ResolveMlAssetsRoot();
        var legacyMlRoot = ResolveLegacyAudioMlRoot();

        if (OperatingSystem.IsWindows())
        {
            yield return Path.Combine(localMlRoot, ".venv", "Scripts", "python.exe");
            yield return Path.Combine(legacyMlRoot, ".venv", "Scripts", "python.exe");
            yield break;
        }

        yield return Path.Combine(localMlRoot, ".venv", "bin", "python");
        yield return Path.Combine(localMlRoot, ".venv", "bin", "python3");
        yield return Path.Combine(legacyMlRoot, ".venv", "bin", "python");
        yield return Path.Combine(legacyMlRoot, ".venv", "bin", "python3");
    }

    private string ResolveConfiguredExecutablePath(string path)
    {
        if (LooksLikeRelativeOrAbsolutePath(path))
        {
            return ResolveConfiguredPath(path);
        }

        return path.Trim();
    }

    private string ResolveConfiguredPath(string path)
    {
        var trimmedPath = path.Trim();
        if (Path.IsPathRooted(trimmedPath))
        {
            return Path.GetFullPath(trimmedPath);
        }

        return Path.GetFullPath(Path.Combine(_env.ContentRootPath, trimmedPath));
    }

    private static bool LooksLikeRelativeOrAbsolutePath(string value) =>
        Path.IsPathRooted(value) ||
        value.Contains(Path.DirectorySeparatorChar) ||
        value.Contains(Path.AltDirectorySeparatorChar);

    private static string GetFirstExistingPathOrFallback(IEnumerable<string> candidates)
    {
        var materializedCandidates = candidates.ToArray();

        foreach (var candidate in materializedCandidates)
        {
            if (File.Exists(candidate))
            {
                return candidate;
            }
        }

        return materializedCandidates[0];
    }

    private static bool CanLaunchExecutable(string executablePath)
    {
        if (File.Exists(executablePath))
        {
            return true;
        }

        if (LooksLikeRelativeOrAbsolutePath(executablePath))
        {
            return false;
        }

        var pathEntries = (Environment.GetEnvironmentVariable("PATH") ?? string.Empty)
            .Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (OperatingSystem.IsWindows())
        {
            var executableExtensions = (Environment.GetEnvironmentVariable("PATHEXT") ?? ".EXE;.BAT;.CMD")
                .Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

            foreach (var pathEntry in pathEntries)
            {
                foreach (var extension in executableExtensions)
                {
                    var candidate = Path.Combine(pathEntry, executablePath + extension);
                    if (File.Exists(candidate))
                    {
                        return true;
                    }
                }
            }

            return false;
        }

        foreach (var pathEntry in pathEntries)
        {
            var candidate = Path.Combine(pathEntry, executablePath);
            if (File.Exists(candidate))
            {
                return true;
            }
        }

        return false;
    }

    private async Task<string?> TryConvertToWavAsync(string audioFilePath, CancellationToken cancellationToken)
    {
        var extension = Path.GetExtension(audioFilePath).Trim().ToLowerInvariant();
        if (extension is ".wav" or ".wave")
        {
            return null;
        }

        const string afconvertPath = "/usr/bin/afconvert";
        if (!OperatingSystem.IsMacOS() || !File.Exists(afconvertPath))
        {
            return null;
        }

        var convertedPath = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid():N}.wav");

        using var process = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = afconvertPath,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true
            }
        };

        process.StartInfo.ArgumentList.Add(audioFilePath);
        process.StartInfo.ArgumentList.Add("-o");
        process.StartInfo.ArgumentList.Add(convertedPath);
        process.StartInfo.ArgumentList.Add("-f");
        process.StartInfo.ArgumentList.Add("WAVE");
        process.StartInfo.ArgumentList.Add("-d");
        process.StartInfo.ArgumentList.Add("LEI16@16000");
        process.StartInfo.ArgumentList.Add("-c");
        process.StartInfo.ArgumentList.Add("1");

        process.Start();

        var stderrTask = process.StandardError.ReadToEndAsync(cancellationToken);
        var stdoutTask = process.StandardOutput.ReadToEndAsync(cancellationToken);

        await process.WaitForExitAsync(cancellationToken);

        var stderr = (await stderrTask).Trim();
        var stdout = (await stdoutTask).Trim();

        if (process.ExitCode == 0 && File.Exists(convertedPath))
        {
            return convertedPath;
        }

        TryDeleteFile(convertedPath);

        if (!string.IsNullOrWhiteSpace(stderr) || !string.IsNullOrWhiteSpace(stdout))
        {
            _logger.LogWarning(
                "afconvert could not normalize audio file '{AudioFilePath}'. stderr: {Stderr} stdout: {Stdout}",
                audioFilePath,
                stderr,
                stdout);
        }

        return null;
    }

    private static string NormalizeLabel(string label) =>
        label.Trim().ToLowerInvariant() switch
        {
            "cat_meow" => "cat",
            "dog_bark" => "dog",
            "none" => "neither",
            "others" => "neither",
            var value => value
        };

    private static void TryDeleteFile(string filePath)
    {
        try
        {
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }
        }
        catch
        {
            // Best-effort cleanup only.
        }
    }

    private static void TryKill(Process process)
    {
        try
        {
            if (!process.HasExited)
            {
                process.Kill(entireProcessTree: true);
            }
        }
        catch
        {
            // Best-effort cleanup only.
        }
    }

    private sealed record PetTranslatorPythonResponse(
        [property: JsonPropertyName("label")] string Label,
        [property: JsonPropertyName("rawLabel")] string? RawLabel,
        [property: JsonPropertyName("confidence")] double Confidence,
        [property: JsonPropertyName("probabilities")] Dictionary<string, double> Probabilities
    );
}

public sealed record PetTranslatorAnalysisResult(
    string Label,
    double Confidence,
    IReadOnlyDictionary<string, double> Probabilities
);

public sealed class PetTranslatorConfigurationException : Exception
{
    public PetTranslatorConfigurationException(string message)
        : base(message)
    {
    }

    public PetTranslatorConfigurationException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}

public sealed class PetTranslatorInferenceException : Exception
{
    public PetTranslatorInferenceException(string message)
        : base(message)
    {
    }

    public PetTranslatorInferenceException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
