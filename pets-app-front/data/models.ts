export interface AppUsersModel {
  // account info
  Id: string | number;
  Name: string;
  Username?: string;
  ChatCode?: string;
  FirstName: string;
  LastName: string;
  Email: string;
  PhoneNumber: string;
  PasswordHash: string;
  Image: string;

  CreatedAt: number | string;
  LastLogin: number | string | null;
  IsApprovedPlaceOwner?: boolean;

  // forum info
  Description: string;
  BookmarkedPostID: string[];
}

export interface ForumPostsModel {
  Id: string;
  UserId: string | number;
  UserName: string;
  UserImage?: string | null;
  HasRegisteredPlace?: boolean;
  Content: string;
  Attachments: ForumPostAttachmentModel[];
  CreatedAt: number | string;
  UpdatedAt?: number | string | null;
  IsAReply: boolean;
  ReplyingToPost?: string | null;
  RepliesCount?: number;
  IsBookmarked?: boolean;
  LikesCount?: number;
  IsLikedByCurrentUser?: boolean;
}

export interface ForumPostAttachmentModel {
  Id: string | number;
  Url: string;
  MediaType: "Image" | "Video";
  FileSizeBytes: number;
  CreatedAt: number | string;
}

export interface ChatMessageModel {
  Id: string;
  Role: "User" | "Bot";
  Content: string;
  CreatedAt: number | string;
}

export interface ChatSessionModel {
  Id: string;
  UserId: string | number;
  Discussion: ChatMessageModel[];
  CreatedAt: number | string;
  UpdatedAt?: number | string | null;
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

export interface DirectMessageUserModel {
  Id: string | number;
  Username: string;
  FirstName: string;
  LastName: string;
  DisplayName: string;
  AvatarUrl: string;
  IsApprovedPlaceOwner: boolean;
}

export interface DirectMessageModel {
  Id: string | number;
  ConversationId: string | number;
  SenderUserId: string | number;
  Content: string;
  MediaUrl?: string | null;
  MediaType?: "Image" | "Video" | null;
  MediaSizeBytes?: number | null;
  CreatedAt: number | string;
}

export interface DirectMessageConversationSummaryModel {
  Id: string | number;
  OtherParticipant: DirectMessageUserModel;
  LastMessagePreview?: string | null;
  LastMessageAt?: number | string | null;
  UnreadCount: number;
  CreatedAt: number | string;
}

export interface DirectMessageConversationModel {
  Id: string | number;
  OtherParticipant: DirectMessageUserModel;
  CreatedAt: number | string;
  LastMessageAt?: number | string | null;
  LastReadAt?: number | string | null;
  Messages: DirectMessageModel[];
}

export interface PlaceModel {
  Id: string;
  OwnerUserId?: string | number | null;
  Name: string;
  Phone: string;
  Email: string;
  Photo: string | null;
  Description: string;
  AddressLine1: string;
  AddressLine2?: string | null;
  City: string;
  Country: string;
  Status: "Active" | "Inactive" | "Closed";
  Type: "Vet" | "PetShop" | "Charity" | "Other";
  Latitude: number | null;
  Longitude: number | null;
  CreatedAt: number | string;
  Images: PlaceImageModel[];
  Schedule: PlaceScheduleModel[];
  AverageRating: number | null;
  ReviewsCount: number;
}

export interface PlaceImageModel {
  Id: string | number;
  Url: string;
  CreatedAt: number | string;
}

export interface PlaceScheduleModel {
  Id: string;
  DayOfWeek: string | number;
  IsClosed: boolean;
  OpenTime?: string | null;
  CloseTime?: string | null;
  BreakStartTime?: string | null;
  BreakEndTime?: string | null;
}

export interface PlaceReviewModel {
  Id: string;
  PlaceId: string;
  UserId: string;
  UserName: string;
  UserImage?: string | null;
  Rating: number;
  Comment: string;
  CreatedAt: number | string;
  UpdatedAt?: number | string | null;
}

export interface PlaceReviewSummaryModel {
  AverageRating: number | null;
  ReviewsCount: number;
}

export interface PlaceOwnerApplicationModel {
  Id: string | number;
  UserId: string | number;
  BusinessName: string;
  Phone: string;
  Email: string;
  Description?: string | null;
  AddressLine1: string;
  AddressLine2?: string | null;
  City: string;
  Country: string;
  RequestedPlaceType: "Vet" | "PetShop" | "Charity" | "Other";
  Status: "Pending" | "Approved" | "Rejected";
  RejectionReason?: string | null;
  AdminNotes?: string | null;
  ReviewedByAdminId?: string | number | null;
  ReviewedAt?: number | string | null;
  CreatedAt: number | string;
  UpdatedAt: number | string;
  Images: PlaceOwnerApplicationImageModel[];
}

export interface PlaceOwnerApplicationImageModel {
  Id: string | number;
  Url: string;
  CreatedAt: number | string;
}

export interface PetModel {
  Id: string;
  UserId: string | number; // BIGINT (matches users.id)
  Name: string;
  SpeciesId: number;
  BreedId: number | null;
  Sex: "Male" | "Female" | "Unknown";
  BirthDate: Date | string | null;
  WeightKg: number | null;
  Color: string;
  Neutered: boolean;
  AvatarUrl: string | null; // user-uploaded URL (or CDN URL)
  Notes: string;
  CreatedAt: number | string;
  UpdatedAt: number | string;
  Species: string;
  Breed: string | null;
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
  VetName?: string | null;
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
  id: string | number;
  Code: string;
  Name: string;
  Breeds: (string | BreedModel)[];
}

export interface BreedModel {
  id: string | number;
  SpeciesId: string | number;
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
  medicationsId: string[];
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
  startDate: Date;
  endDate?: Date | null;
  frequencyInDays: number;
  times: string[];
  reminderEnabled: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const Color = Object.freeze({
  CALICO: "Calico",
  ORANGE: "Orange",
  BLACK: "Black",
  WHITE: "White",
  UNKNOWN: "Unknown",
});

export const Sex = Object.freeze({
  MALE: "Male",
  FEMALE: "Female",
  UNKNOWN: "Unknown",
});
