namespace PetCare.Api.Model;

public class VaccineRecordModel
{
    public long Id { get; set; }
    public Guid PetId { get; set; }
    public string VaccineName { get; set; } = default!;
    public VaccineStatus Status { get; set; } = VaccineStatus.NotDone;
    public DateTimeOffset? DateAdministered { get; set; }
    public DateTimeOffset? NextDueDate { get; set; }
    public string? Notes { get; set; }
    public string? Veterinarian { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public PetModel Pet { get; set; } = null!;
}
