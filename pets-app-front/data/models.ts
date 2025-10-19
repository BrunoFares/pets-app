export interface AppUsersModel {
  // account info
  Id: string,
  Name: string,
  FirstName: string,
  LastName: string,
  Email: string,
  PhoneNumber: string,
  PasswordHash: string,
  Image: string,

  CreatedAt: number,
  LastLogin: number,
  
  // forum info
  Description: string,
  BookmarkedPostID: string[]
}

export interface ForumPostsModel {
  Id: string,
  UserId: string,
  UserName: string,
  Content: string,
  Attachments: [],
  CreatedAt: number,
}

export interface ChatModel {
  Id: string,
  UserId: string,
  Discussion: {
    User: string[],
    Bot: string[]
  },
  CreatedAt: number,
}

export interface PetModel {
  Id: string,
  UserId: string, // BIGINT (matches users.id)
  Name: string,
  SpeciesId: 1,
  BreedId: 1,
  Sex: string,
  BirthDate: Date,
  ApproxAgeMonths: number,
  WeightKg: number,
  Color: string,
  Neutered: true,
  AvatarUrl: string // user-uploaded URL (or CDN URL)
  Notes: string,
  CreatedAt: number,
  UpdatedAt: number,
  Species: string,
  Breed: string,
}

export interface PetShopModel { 
  Id: string,
  PetsId: string,
}

export interface VetModel {
  Id: string,
  PetsId: string,
}

export interface PetPlaceModel {
  Id: string,
  Name: string,
  Phone: string,
  Email: string,
  Photo: string,
  Description: string,
  AddressLine1: string,
  AddressLine2: string,
  City: string,
  Country: string,
  CreatedAt: number,
  Status: string,
  lat: string,
  lon: string,
}

export interface SpeciesModel {
  Id: string,
  Code: string,
  Name: string,
  Breeds: string[],
}

export interface BreedModel {
  Id: string,
  SpeciesId: string,
  Name: string,
  Species: string,
}