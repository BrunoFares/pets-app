namespace PetCare.Api.Model;

public enum PetSex
{
    Male = 1,
    Female = 2,
    Unknown = 3
}

public enum PetColor
{
    Calico = 1,
    Orange = 2,
    Black = 3,
    White = 4,
    Unknown = 5
}

public enum PlaceType
{
    Vet = 1,
    PetShop = 2,
    Other = 3
}

public enum PlaceStatus
{
    Active = 1,
    Inactive = 2,
    Closed = 3
}

public enum VaccineStatus
{
    Done = 1,
    NotDone = 2,
    Due = 3
}

public enum IllnessStatus
{
    Ongoing = 1,
    Resolved = 2
}

public enum ChatRole
{
    User = 1,
    Bot = 2
}

public enum AdminRole
{
    Admin = 1,
    Manager = 2
}
