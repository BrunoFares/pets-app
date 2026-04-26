using System.ComponentModel.DataAnnotations;
using PetCare.Api.Services;

namespace PetCare.Api.DTOs;

public record CreateMedicationRecordRequest(
    [Range(1, long.MaxValue)] long IllnessId,
    [Required, MaxLength(200)] string MedicationName,
    [MaxLength(200)] string? Dosage,
    [MaxLength(2000)] string? Instructions,
    [Required] DateTimeOffset StartDate,
    DateTimeOffset? EndDate,
    [Range(1, 365)] int FrequencyInDays,
    List<string> Times,
    bool ReminderEnabled,
    bool IsActive
) : IValidatableObject
{
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext) =>
        MedicationScheduleRules.ValidateMedicationRequest(MedicationName, StartDate, EndDate, Times, ReminderEnabled);
}

public record UpdateMedicationRecordRequest(
    [Required, MaxLength(200)] string MedicationName,
    [MaxLength(200)] string? Dosage,
    [MaxLength(2000)] string? Instructions,
    [Required] DateTimeOffset StartDate,
    DateTimeOffset? EndDate,
    [Range(1, 365)] int FrequencyInDays,
    List<string> Times,
    bool ReminderEnabled,
    bool IsActive
) : IValidatableObject
{
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext) =>
        MedicationScheduleRules.ValidateMedicationRequest(MedicationName, StartDate, EndDate, Times, ReminderEnabled);
}

public record MedicationRecordResponse(
    long Id,
    long IllnessId,
    string MedicationName,
    string? Dosage,
    string? Instructions,
    DateTimeOffset StartDate,
    DateTimeOffset? EndDate,
    int FrequencyInDays,
    IReadOnlyList<string> Times,
    bool ReminderEnabled,
    bool IsActive,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);
