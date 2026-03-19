export interface AppUsersModel {
  // account info
  Id: string;
  Name: string;
  FirstName: string;
  LastName: string;
  Email: string;
  PhoneNumber: string;
  PasswordHash: string;
  Image: string;

  CreatedAt: number;
  LastLogin: number;

  // forum info
  Description: string;
  BookmarkedPostID: string[];
}

export interface ForumPostsModel {
  Id: string;
  UserId: string;
  UserName: string;
  Content: string;
  Attachments: [];
  CreatedAt: number;
  IsAReply: boolean;
  ReplyingToPost?: string;
}

export interface ChatModel {
  Id: string;
  UserId: string;
  Discussion: {
    User: string[];
    Bot: string[];
  };
  CreatedAt: number;
}

export interface PetModel {
  Id: string;
  UserId: string; // BIGINT (matches users.id)
  Name: string;
  SpeciesId: 1;
  BreedId: 1;
  Sex: "Male" | "Female";
  BirthDate: Date;
  WeightKg: number;
  Color: string;
  Neutered: boolean;
  AvatarUrl: string; // user-uploaded URL (or CDN URL)
  Notes: string;
  CreatedAt: number;
  UpdatedAt: number;
  Species: string;
  Breed: string;
  ConsultationsId: number[];
}

export interface PetShopModel {
  Id: string;
  PetsId: string;
}

export interface VetModel {
  Id: string;
  ConsultationId: string;
}

export interface ConsultationModel {
  Id: string;
  PetId: string;
  VetId: string;
  Date: Date;
  Details: string;
}

export interface PetPlaceModel {
  Id: string;
  Name: string;
  Phone: string;
  Email: string;
  Photo: string;
  Description: string;
  AddressLine1: string;
  AddressLine2: string;
  City: string;
  Country: string;
  CreatedAt: number;
  Status: string;
  lat: string;
  lon: string;
}

export interface SpeciesModel {
  id: string;
  Code: string;
  Name: string;
  Breeds: string[];
}

export interface BreedModel {
  id: string;
  SpeciesId: string;
  Name: string;
  Species: string;
}

export interface VaccineRecordModel {
  Id: string;
  petId: string;
  vaccineName: string;
  status: "Done" | "Not Done" | "Due";
  dateAdministered?: Date;
  nextDueDate?: Date;
  notes?: string;
  veterinarian?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IllnessRecordModel {
  Id: string;
  petId: string;
  illnessName: string;
  diagnosisDate: Date;
  status: "Ongoing" | "Resolved";
  description?: string;
  notes?: string;
  curedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicationRecordModel {
  Id: string;
  illnessId: string;
  medicationName: string;
  dosage?: string;
  instructions?: string;
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const Color = Object.freeze({
  CALICO: "Calico",
  ORANGE: "Orange",
  BLACK: "Black",
  WHITE: "White",
});

export const Sex = Object.freeze({
  MALE: "Male",
  FEMALE: "Female",
});
