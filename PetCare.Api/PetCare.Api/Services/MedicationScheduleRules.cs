using System.ComponentModel.DataAnnotations;
using System.Globalization;
using PetCare.Api.Model;

namespace PetCare.Api.Services;

public static class MedicationScheduleRules
{
    public const int MaxTimesPerDay = 6;
    private const string TimeFormat = "HH:mm";

    public static IEnumerable<ValidationResult> ValidateMedicationRequest(
        string medicationName,
        DateTimeOffset startDate,
        DateTimeOffset? endDate,
        IReadOnlyList<string>? times,
        bool reminderEnabled)
    {
        if (string.IsNullOrWhiteSpace(medicationName))
        {
            yield return new ValidationResult("Medication name cannot be empty.", new[] { "MedicationName" });
        }

        if (endDate is not null && endDate < startDate)
        {
            yield return new ValidationResult("End date must be on or after the start date.", new[] { "EndDate" });
        }

        var providedTimes = times is { Count: > 0 };
        if (!TryNormalizeTimes(times, out var normalizedTimes, out var errorMessage))
        {
            yield return new ValidationResult(errorMessage!, new[] { "Times" });
            yield break;
        }

        if (providedTimes && normalizedTimes.Count == 0)
        {
            yield return new ValidationResult("Times must contain at least one valid time when provided.", new[] { "Times" });
            yield break;
        }

        if (reminderEnabled && normalizedTimes.Count == 0)
        {
            yield return new ValidationResult("At least one valid time is required when reminders are enabled.", new[] { "Times" });
        }
    }

    public static bool TryNormalizeTimes(
        IReadOnlyList<string>? rawTimes,
        out List<string> normalizedTimes,
        out string? errorMessage)
    {
        normalizedTimes = new List<string>();
        errorMessage = null;

        var parsedTimes = new List<TimeOnly>();
        foreach (var rawTime in rawTimes ?? Array.Empty<string>())
        {
            var trimmedTime = rawTime?.Trim();
            if (string.IsNullOrWhiteSpace(trimmedTime))
            {
                continue;
            }

            if (!TimeOnly.TryParseExact(trimmedTime, TimeFormat, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedTime))
            {
                errorMessage = "Times must be valid 24-hour values in HH:mm format.";
                return false;
            }

            parsedTimes.Add(parsedTime);
        }

        if (parsedTimes.Count > MaxTimesPerDay)
        {
            errorMessage = $"A medication can have at most {MaxTimesPerDay} times per day.";
            return false;
        }

        normalizedTimes = parsedTimes
            .OrderBy(t => t)
            .Select(t => t.ToString(TimeFormat, CultureInfo.InvariantCulture))
            .ToList();

        if (normalizedTimes.Distinct(StringComparer.Ordinal).Count() != normalizedTimes.Count)
        {
            errorMessage = "Duplicate medication times are not allowed.";
            return false;
        }

        return true;
    }

    public static IReadOnlyList<string> NormalizeTimesForResponse(IReadOnlyList<string>? rawTimes)
    {
        if (TryNormalizeTimes(rawTimes, out var normalizedTimes, out _))
        {
            return normalizedTimes;
        }

        return (rawTimes ?? Array.Empty<string>())
            .Where(t => !string.IsNullOrWhiteSpace(t))
            .Select(t => t.Trim())
            .ToList();
    }

    public static bool IsScheduledOnDate(MedicationRecordModel medication, DateTimeOffset instant)
    {
        if (medication.FrequencyInDays <= 0)
        {
            return false;
        }

        var currentDate = DateOnly.FromDateTime(instant.UtcDateTime);
        var startDate = DateOnly.FromDateTime(medication.StartDate.UtcDateTime);
        if (currentDate < startDate)
        {
            return false;
        }

        if (medication.EndDate is not null)
        {
            var endDate = DateOnly.FromDateTime(medication.EndDate.Value.UtcDateTime);
            if (currentDate > endDate)
            {
                return false;
            }
        }

        var daysSinceStart = currentDate.DayNumber - startDate.DayNumber;
        return daysSinceStart % medication.FrequencyInDays == 0;
    }

    public static TimeOnly GetFirstTimeOrMax(IReadOnlyList<string>? rawTimes)
    {
        if (TryNormalizeTimes(rawTimes, out var normalizedTimes, out _) &&
            normalizedTimes.Count > 0 &&
            TimeOnly.TryParseExact(normalizedTimes[0], TimeFormat, CultureInfo.InvariantCulture, DateTimeStyles.None, out var firstTime))
        {
            return firstTime;
        }

        return TimeOnly.MaxValue;
    }
}
