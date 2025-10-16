import { AppUsersModel, BreedModel, ChatModel, ForumPostsModel, PetModel, PetPlaceModel, PetShopModel, SpeciesModel, VetModel } from "./models";

export const AppUsers: AppUsersModel[] = [
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

export const ForumPosts: ForumPostsModel[] = [
  {
    Id: "1",
    UserId: "1",
    UserName: "Kalinka",
    Content: "firstPost badde tawlo shwe fa aam bektob zyede 3reft kif marhaba rayis kifak shu akhbarak meshe l7al kello tmm",
    Attachments: [],
    CreatedAt: 1000,
  },
  {
    Id: "2",
    UserId: "2",
    UserName: "Lightning McQueen",
    Content: "kachow",
    Attachments: [],
    CreatedAt: 1000,
  },
  {
    Id: "3",
    UserId: "3",
    UserName: "Minouche",
    Content: "eh rawae hamdellah",
    Attachments: [],
    CreatedAt: 1000,
  },
  {
    Id: "4",
    UserId: "4",
    UserName: "Sonic Al Qonfoz",
    Content: "you're going my way",
    Attachments: [],
    CreatedAt: 1000,
  },
];

export const Chat: ChatModel[] = [
  {
    Id: "1",
    UserId: "1",
    Discussion: {
      User: [""],
      Bot: [""]
    },
    CreatedAt: 1000,
  },
];

export const Pets: PetModel[] = [
  {
    Id: "1",
    UserId: "1", // BIGINT (matches users.id)
    Name: "Kalinka",
    SpeciesId: 1,
    BreedId: 1,
    Sex: "Female",
    BirthDate: new Date(2011, 7, 25),
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

export const PetShops: PetShopModel[] = [
  {
    Id: "1",
    PetsId: "1",
  },
];

export const Vets: VetModel[] = [
  {
    Id: "1",
    PetsId: "1",
  },
];

export const PetPlaces: PetPlaceModel[] = [
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

export const Species: SpeciesModel[] = [
  {
    Id: "1",
    Code: "",
    Name: "",
    Breeds: [],
  },
];

export const Breeds: BreedModel[] = [
  {
    Id: "1",
    SpeciesId: "",
    Name: "",
    Species: "",
  },
];
