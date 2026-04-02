import {
  AppUsersModel,
  BreedModel,
  ChatModel,
  Color,
  ConsultationModel,
  ForumPostsModel,
  IllnessRecordModel,
  MedicationRecordModel,
  PetModel,
  PetPlaceModel,
  PetShopModel,
  Sex,
  SpeciesModel,
  VaccineRecordModel,
  VetModel,
} from "./models";

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
    Image: "",
    Description: "Description",
    PasswordHash: "brunofares1234",
    BookmarkedPostID: ["1"],
  },
  {
    Id: "2",
    Name: "Jason",
    Email: "jason@gmail.com",
    PhoneNumber: "76315109",
    CreatedAt: 1000,
    LastLogin: 1220,
    FirstName: "Jason",
    LastName: "Moussi",
    Image: "",
    Description: "Paris SG tous ensemble on fera pipi",
    PasswordHash: "jasonmoussi1234",
    BookmarkedPostID: ["1"],
  },
  {
    Id: "3",
    Name: "John",
    Email: "johngreen@gmail.com",
    PhoneNumber: "76315109",
    CreatedAt: 1000,
    LastLogin: 1220,
    FirstName: "John",
    LastName: "Green",
    Image: "",
    Description: "Hello! I'm using WhatsApp.",
    PasswordHash: "johngreen1234",
    BookmarkedPostID: ["1"],
  },
  {
    Id: "4",
    Name: "Joe",
    Email: "joewalsh@gmail.com",
    PhoneNumber: "76315109",
    CreatedAt: 1000,
    LastLogin: 1220,
    FirstName: "Joe",
    LastName: "Walsh",
    Image: "",
    Description:
      "welcome to the hotel california papapapapapapa such a lovely place",
    PasswordHash: "joewalsh1234",
    BookmarkedPostID: ["1"],
  },
];

export const ForumPosts: ForumPostsModel[] = [
  {
    Id: "1",
    UserId: "1",
    UserName: "brunofares1234",
    Content:
      "firstPost badde tawlo shwe fa aam bektob zyede 3reft kif marhaba rayis kifak shu akhbarak meshe l7al kello tmm",
    Attachments: [],
    IsAReply: true,
    ReplyingToPost: "2",
    CreatedAt: 1000,
  },
  {
    Id: "2",
    UserId: "2",
    UserName: "jasonmoussi1234",
    Content: "kachow",
    Attachments: [],
    IsAReply: false,
    CreatedAt: 1000,
  },
  {
    Id: "3",
    UserId: "3",
    UserName: "johngreen1234",
    Content: "eh rawae hamdellah",
    Attachments: [],
    IsAReply: true,
    ReplyingToPost: "1",
    CreatedAt: 1000,
  },
  {
    Id: "4",
    UserId: "4",
    UserName: "joewalsh1234",
    Content: "you're going my way",
    Attachments: [],
    IsAReply: false,
    CreatedAt: 1000,
  },
];

export const Chat: ChatModel[] = [
  {
    Id: "1",
    UserId: "1",
    Discussion: {
      User: [""],
      Bot: [""],
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
    Sex: Sex.FEMALE,
    BirthDate: new Date(2011, 7, 25),
    WeightKg: 2.5,
    Color: Color.CALICO,
    Neutered: true,
    AvatarUrl: "", // user-uploaded URL (or CDN URL)
    Notes: "",
    CreatedAt: 1000,
    UpdatedAt: 1220,
    Species: "cat",
    Breed: "House Cat",
    ConsultationsId: [1, 2, 3],
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
    ConsultationId: "1",
  },
];

export const Consultations: ConsultationModel[] = [
  {
    Id: "1",
    PetId: "1",
    VetId: "1",
    Date: new Date(2021, 7, 25),
    Details: "Waja3 baten w hek fa 3tiya kes 3ara2 men baad el 3asha.",
  },
  {
    Id: "2",
    PetId: "1",
    VetId: "2",
    Date: new Date(2022, 7, 25),
    Details: "Mashi aam bt jarib tetmanyak aa ayrak bro shu bdak fiya.",
  },
  {
    Id: "3",
    PetId: "1",
    VetId: "2",
    Date: new Date(2025, 2, 1),
    Details: "Mb3rf saraha bs bsayntak ktir beshaa broooo hhhhhh.",
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
    id: "1",
    Code: "",
    Name: "Dog",
    Breeds: [],
  },
  {
    id: "2",
    Code: "",
    Name: "Cat",
    Breeds: [],
  },
];

export const Breeds: BreedModel[] = [
  {
    id: "1",
    SpeciesId: "1",
    Name: "Labrador",
    Species: "",
  },
  {
    id: "2",
    SpeciesId: "1",
    Name: "Golden Retriever",
    Species: "",
  },
  {
    id: "3",
    SpeciesId: "2",
    Name: "Siamese",
    Species: "",
  },
  {
    id: "4",
    SpeciesId: "2",
    Name: "Maine Coon",
    Species: "",
  },
  {
    id: "5",
    SpeciesId: "2",
    Name: "British Shorthair",
    Species: "",
  },
  {
    id: "6",
    SpeciesId: "2",
    Name: "Persian",
    Species: "",
  },
  {
    id: "7",
    SpeciesId: "2",
    Name: "Ragdoll",
    Species: "",
  },
];

export const VaccineRecords: VaccineRecordModel[] = [
  {
    Id: "1",
    petId: "1",
    vaccineName: "Rabies",
    status: "Done",
    dateAdministered: new Date(2012, 7, 25),
    nextDueDate: new Date(2013, 7, 25),
    notes: "nothing to note",
    veterinarian: "1",
    createdAt: new Date(2012, 7, 25),
    updatedAt: new Date(2013, 7, 25),
  },
];

export const IllnessRecords: IllnessRecordModel[] = [
  {
    Id: "1",
    petId: "1",
    illnessName: "Diabetes",
    status: "Resolved",
    medicationsId: ["1"],
    diagnosisDate: new Date(2012, 7, 25),
    curedDate: new Date(2013, 2, 20),
    notes: "nothing to note",
    description: "something",
    createdAt: new Date(2012, 7, 25),
    updatedAt: new Date(2013, 2, 20),
  },
];

export const MedicationRecords: MedicationRecordModel[] = [
  {
    Id: "1",
    illnessId: "1",
    medicationName: "Insulin",
    dosage: "0.25-0.5 U/kg q12h 0.11-0.23 U/lb q12h",
    instructions:
      "Recheck examination in clinic 5-10 days after starting insulin",
    times: ["12:00"],
    reminderEnabled: true,
    frequencyInDays: 1,
    startDate: new Date(2016, 7, 2),
    endDate: new Date(2018, 7, 2),
    isActive: true,
    createdAt: new Date(2016, 7, 2),
    updatedAt: new Date(2018, 7, 2),
  },
];
