namespace PetCare.Api.Model;

public class MedicationRecordModel
{
    public long Id { get; set; }
    public long IllnessId { get; set; }
    public string MedicationName { get; set; } = default!;
    public string? Dosage { get; set; }
    public string? Instructions { get; set; }
    public DateTimeOffset StartDate { get; set; }
    public DateTimeOffset? EndDate { get; set; }
    public int FrequencyInDays { get; set; }
    public List<string> Times { get; set; } = new();
    public bool ReminderEnabled { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public IllnessRecordModel Illness { get; set; } = null!;
}
