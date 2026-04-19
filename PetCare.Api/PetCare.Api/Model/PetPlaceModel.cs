namespace PetCare.Api.Model;

public class PetPlaceModel
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public string Phone { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string? Photo { get; set; }
    public string? Description { get; set; }
    public string AddressLine1 { get; set; } = default!;
    public string? AddressLine2 { get; set; }
    public string City { get; set; } = default!;
    public string Country { get; set; } = default!;
    public PlaceStatus Status { get; set; } = PlaceStatus.Active;
    public PlaceType Type { get; set; } = PlaceType.Other;
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public List<PetPlaceScheduleModel> Schedules { get; set; } = new();
    public List<ConsultationModel> Consultations { get; set; } = new();
}
