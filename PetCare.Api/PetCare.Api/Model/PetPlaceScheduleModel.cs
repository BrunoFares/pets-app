namespace PetCare.Api.Model;

public class PetPlaceScheduleModel
{
    public long Id { get; set; }
    public Guid PetPlaceId { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public bool IsClosed { get; set; }
    public TimeOnly? OpenTime { get; set; }
    public TimeOnly? CloseTime { get; set; }
    public TimeOnly? BreakStartTime { get; set; }
    public TimeOnly? BreakEndTime { get; set; }

    public PetPlaceModel PetPlace { get; set; } = default!;
}
