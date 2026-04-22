using System.ComponentModel.DataAnnotations;
using PetCare.Api.Model;

namespace PetCare.Api.DTOs;

public record PlaceScheduleRequest(
    [Required] DayOfWeek DayOfWeek,
    [Required] bool IsClosed,
    TimeOnly? OpenTime,
    TimeOnly? CloseTime,
    TimeOnly? BreakStartTime,
    TimeOnly? BreakEndTime
);

public record PlaceScheduleResponse(
    long Id,
    DayOfWeek DayOfWeek,
    bool IsClosed,
    TimeOnly? OpenTime,
    TimeOnly? CloseTime,
    TimeOnly? BreakStartTime,
    TimeOnly? BreakEndTime
);

public record CreatePlaceRequest(
    [Required, MaxLength(200)] string Name,
    [Required, MaxLength(50)] string Phone,
    [Required, EmailAddress, MaxLength(320)] string Email,
    [MaxLength(1024)] string? Photo,
    [MaxLength(2000)] string? Description,
    [Required, MaxLength(200)] string AddressLine1,
    [MaxLength(200)] string? AddressLine2,
    [Required, MaxLength(100)] string City,
    [Required, MaxLength(100)] string Country,
    [Required] PlaceStatus Status,
    [Required] PlaceType Type,
    decimal? Latitude,
    decimal? Longitude,
    [Required, MinLength(7), MaxLength(7)] IReadOnlyList<PlaceScheduleRequest> Schedule
) : IValidatableObject
{
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext) =>
        PlaceScheduleValidation.ValidateWeeklySchedule(Schedule);
}

public record UpdatePlaceRequest(
    [Required, MaxLength(200)] string Name,
    [Required, MaxLength(50)] string Phone,
    [Required, EmailAddress, MaxLength(320)] string Email,
    [MaxLength(1024)] string? Photo,
    [MaxLength(2000)] string? Description,
    [Required, MaxLength(200)] string AddressLine1,
    [MaxLength(200)] string? AddressLine2,
    [Required, MaxLength(100)] string City,
    [Required, MaxLength(100)] string Country,
    [Required] PlaceStatus Status,
    [Required] PlaceType Type,
    decimal? Latitude,
    decimal? Longitude,
    [Required, MinLength(7), MaxLength(7)] IReadOnlyList<PlaceScheduleRequest> Schedule
) : IValidatableObject
{
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext) =>
        PlaceScheduleValidation.ValidateWeeklySchedule(Schedule);
}

public record PlaceResponse(
    Guid Id,
    string Name,
    string Phone,
    string Email,
    string? Photo,
    string? Description,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string Country,
    PlaceStatus Status,
    PlaceType Type,
    decimal? Latitude,
    decimal? Longitude,
    DateTimeOffset CreatedAt,
    IReadOnlyList<PlaceScheduleResponse> Schedule,
    double? AverageRating,
    int ReviewsCount
);

public record CreatePlaceReviewRequest(
    [Required, Range(1, 5)] int Rating,
    [MaxLength(2000)] string? Comment
);

public record UpdatePlaceReviewRequest(
    [Required, Range(1, 5)] int Rating,
    [MaxLength(2000)] string? Comment
);

public record PlaceReviewResponse(
    Guid Id,
    Guid PlaceId,
    long UserId,
    string UserDisplayName,
    int Rating,
    string? Comment,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt
);

public record PlaceReviewListResponse(
    IReadOnlyList<PlaceReviewResponse> Items,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages
);

internal static class PlaceScheduleValidation
{
    public static IEnumerable<ValidationResult> ValidateWeeklySchedule(IReadOnlyList<PlaceScheduleRequest>? schedule)
    {
        if (schedule is null)
        {
            yield return new ValidationResult("Schedule is required.", new[] { "Schedule" });
            yield break;
        }

        if (schedule.Count != 7)
        {
            yield return new ValidationResult("Schedule must contain exactly 7 entries, one for each day of the week.", new[] { "Schedule" });
        }

        var seenDays = new HashSet<DayOfWeek>();
        for (var index = 0; index < schedule.Count; index++)
        {
            var item = schedule[index];
            if (!Enum.IsDefined(item.DayOfWeek))
            {
                yield return new ValidationResult($"Invalid day of week value: {item.DayOfWeek}.", new[] { $"Schedule[{index}].DayOfWeek" });
                continue;
            }

            if (!seenDays.Add(item.DayOfWeek))
            {
                yield return new ValidationResult($"Duplicate schedule entry for {item.DayOfWeek}.", new[] { "Schedule" });
            }

            var memberPrefix = $"Schedule[{index}]";
            if (item.IsClosed)
            {
                if (item.OpenTime.HasValue || item.CloseTime.HasValue || item.BreakStartTime.HasValue || item.BreakEndTime.HasValue)
                {
                    yield return new ValidationResult(
                        $"{item.DayOfWeek} is marked as closed, so opening, closing, and break times must be omitted.",
                        new[] { memberPrefix });
                }

                continue;
            }

            if (!item.OpenTime.HasValue || !item.CloseTime.HasValue)
            {
                yield return new ValidationResult(
                    $"{item.DayOfWeek} must include both OpenTime and CloseTime when it is not closed.",
                    new[] { memberPrefix });
                continue;
            }

            if (item.OpenTime.Value >= item.CloseTime.Value)
            {
                yield return new ValidationResult(
                    $"{item.DayOfWeek} must have OpenTime earlier than CloseTime.",
                    new[] { memberPrefix });
            }

            var hasBreakStart = item.BreakStartTime.HasValue;
            var hasBreakEnd = item.BreakEndTime.HasValue;
            if (hasBreakStart != hasBreakEnd)
            {
                yield return new ValidationResult(
                    $"{item.DayOfWeek} must provide both BreakStartTime and BreakEndTime together.",
                    new[] { memberPrefix });
                continue;
            }

            if (!hasBreakStart || !hasBreakEnd)
            {
                continue;
            }

            if (item.BreakStartTime!.Value >= item.BreakEndTime!.Value)
            {
                yield return new ValidationResult(
                    $"{item.DayOfWeek} must have BreakStartTime earlier than BreakEndTime.",
                    new[] { memberPrefix });
            }

            if (item.BreakStartTime.Value <= item.OpenTime.Value || item.BreakEndTime.Value >= item.CloseTime.Value)
            {
                yield return new ValidationResult(
                    $"{item.DayOfWeek} break times must fall strictly inside the opening hours.",
                    new[] { memberPrefix });
            }
        }

        foreach (var day in Enum.GetValues<DayOfWeek>())
        {
            if (!seenDays.Contains(day))
            {
                yield return new ValidationResult($"Schedule is missing {day}.", new[] { "Schedule" });
            }
        }
    }
}
