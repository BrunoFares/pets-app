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

        if (!File.Exists(audioFilePath))
        {
            throw new PetTranslatorInferenceException("The uploaded audio file could not be found for analysis.");
        }

        if (!File.Exists(pythonExecutablePath))
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
                _logger.LogInformation("Pet translator stderr: {Stderr}", stderr);
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

            var label = NormalizeLabel(response.Label);
            var probabilities = response.Probabilities
                .ToDictionary(pair => NormalizeLabel(pair.Key), pair => pair.Value, StringComparer.OrdinalIgnoreCase);

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
            return Path.GetFullPath(_options.PythonExecutablePath);
        }

        var audioMlRoot = ResolveAudioMlRoot();
        var virtualEnvPython = Path.Combine(audioMlRoot, ".venv", "bin", "python");
        return virtualEnvPython;
    }

    private string ResolveModelScriptPath()
    {
        if (!string.IsNullOrWhiteSpace(_options.ModelScriptPath))
        {
            return Path.GetFullPath(_options.ModelScriptPath);
        }

        return Path.Combine(_env.ContentRootPath, "ML", "predict_pet_audio.py");
    }

    private string ResolveModelPath()
    {
        if (!string.IsNullOrWhiteSpace(_options.ModelPath))
        {
            return Path.GetFullPath(_options.ModelPath);
        }

        var audioMlRoot = ResolveAudioMlRoot();
        return Path.Combine(audioMlRoot, "models", "best_model.pth");
    }

    private string ResolveAudioMlRoot() =>
        Path.GetFullPath(Path.Combine(_env.ContentRootPath, "..", "..", "..", "audio-ml"));

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
