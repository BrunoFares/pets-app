export const AppUsers = [
  {
    Id: "1",
    Name: "Bruno",
    Email: "bruno@gmail.com",
    PhoneNumber: "76315109",
    CreatedAt: 1000,
    LastLogin: 1220,
    FirstName: "Bruno",
    LastName: "Fares",
    PasswordHash: "brunofares1234",
  },
];

export const ForumPosts = [
  {
    Id: "1",
    UserId: "1",
    Title: "",
    Body: "",
    Attachments: [],
    CreatedAt: 1000,
  },
];

export const Chat = [
  {
    Id: "1",
    UserId: "1",
    Discussion: {},
    CreatedAt: 1000,
  },
];

export const Pets = [
  {
    Id: "1",
    UserId: "1", // BIGINT (matches users.id)
    Name: "Kalinka",
    SpeciesId: 1,
    BreedId: 1,
    Sex: "Female",
    BirthDate: "25/07/2011",
    ApproxAgeMonths: 169,
    WeightKg: 2.5,
    Color: "calico",
    Neutered: true,
    AvatarUrl: "", // user-uploaded URL (or CDN URL)
    Notes: "",
    CreatedAt: 1000,
    UpdatedAt: 1220,
    Species: "",
    Breed: "",
  },
];

export const PetShops = [
  {
    Id: "1",
    PetsId: "1",
  },
];

export const Vets = [
  {
    Id: "1",
    PetsId: "1",
  },
];

export const PetPlaces = [
  {
    Id: "1",
    Name: "Kalinka",
    Phone: "1234556",
    Email: "petplace@gmail.com",
    Photo: "",
    Description: "",
    AddressLine1: "",
    AddressLine2: "",
    City: "Beirut",
    Country: "Lebanon",
    CreatedAt: 1000,
    Status: "active",
    lat: "",
    lon: "",
  },
];

export const Species = [
  {
    Id: "1",
    Code: "",
    Name: "",
    Breeds: [],
  },
];

export const Breeds = [
  {
    Id: "1",
    SpeciesId: "",
    Name: "",
    Species: [],
  },
];
