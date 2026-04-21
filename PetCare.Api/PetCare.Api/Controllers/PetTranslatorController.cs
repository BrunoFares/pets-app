using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using PetCare.Api.DTOs;
using PetCare.Api.Security;
using PetCare.Api.Services;

namespace PetCare.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = AuthConstants.Policies.UserOnly)]
public class PetTranslatorController : ControllerBase
{
    private readonly PetTranslatorService _petTranslatorService;

    public PetTranslatorController(PetTranslatorService petTranslatorService)
    {
        _petTranslatorService = petTranslatorService;
    }

    [HttpPost("analyze")]
    [Consumes("multipart/form-data")]
    [EnableRateLimiting("uploads")]
    [RequestSizeLimit(AudioUploadValidator.MaxAudioBytes)]
    public async Task<IActionResult> Analyze([FromForm] UploadAudioRequest request, CancellationToken cancellationToken)
    {
        if (!AudioUploadValidator.TryValidateAudio(request.File, out var errorMessage, out var extension))
        {
            return BadRequest(new { message = errorMessage });
        }

        var tempFilePath = Path.Combine(
            Path.GetTempPath(),
            $"{Guid.NewGuid():N}{extension}");

        await using (var stream = System.IO.File.Create(tempFilePath))
        {
            await request.File.CopyToAsync(stream, cancellationToken);
        }

        try
        {
            var result = await _petTranslatorService.AnalyzeAsync(tempFilePath, cancellationToken);
            var translationAvailable = result.Label is "cat" or "dog";

            return Ok(new AnalyzePetAudioResponse(
                result.Label,
                result.Confidence,
                result.Probabilities,
                translationAvailable,
                translationAvailable
                    ? $"The model detected {result.Label} audio."
                    : "The model did not identify this recording as cat or dog audio."
            ));
        }
        catch (PetTranslatorConfigurationException ex)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                message = ex.Message
            });
        }
        catch (PetTranslatorInferenceException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
        finally
        {
            try
            {
                if (System.IO.File.Exists(tempFilePath))
                {
                    System.IO.File.Delete(tempFilePath);
                }
            }
            catch
            {
                // Best-effort cleanup only.
            }
        }
    }
}
