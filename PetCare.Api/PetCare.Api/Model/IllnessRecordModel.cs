namespace PetCare.Api.Model;

public class IllnessRecordModel
{
    public long Id { get; set; }
    public Guid PetId { get; set; }
    public string IllnessName { get; set; } = default!;
    public DateTimeOffset DiagnosisDate { get; set; }
    public IllnessStatus Status { get; set; } = IllnessStatus.Ongoing;
    public string? Description { get; set; }
    public string? Notes { get; set; }
    public DateTimeOffset? CuredDate { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public PetModel Pet { get; set; } = null!;
    public List<MedicationRecordModel> Medications { get; set; } = new();
}
