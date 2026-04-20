import * as ImagePicker from "expo-image-picker";
import {
  AppUsersModel,
  BreedModel,
  ConsultationModel,
  IllnessRecordModel,
  MedicationRecordModel,
  PetModel,
  SpeciesModel,
  VaccineRecordModel,
} from "@/data/models";
import { apiRequest, resolveApiUrl } from "@/lib/api";
import { normalizeMedicationReminderRecord } from "@/lib/medication-reminders";

type ApiUserResponse = {
  id: number;
  username: string;
  name?: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  image?: string | null;
  description?: string | null;
  createdAt: string;
  lastLogin?: string | null;
};

type ApiPetResponse = {
  id: string;
  userId: number;
  name: string;
  speciesId: number;
  species: string;
  breedId?: number | null;
  breed?: string | null;
  sex: "Male" | "Female" | "Unknown";
  birthDate?: string | null;
  weightKg?: number | null;
  color: string;
  neutered: boolean;
  avatarUrl?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

type ApiConsultationResponse = {
  id: number;
  petId: string;
  vetPlaceId?: string | null;
  vetName?: string | null;
  date: string;
  details: string;
  createdAt: string;
  updatedAt?: string | null;
};

type ApiVaccineResponse = {
  id: number;
  petId: string;
  vaccineName: string;
  status: "Done" | "NotDone" | "Due";
  dateAdministered?: string | null;
  nextDueDate?: string | null;
  notes?: string | null;
  veterinarian?: string | null;
  createdAt: string;
  updatedAt: string;
};

type ApiIllnessResponse = {
  id: number;
  petId: string;
  illnessName: string;
  diagnosisDate: string;
  status: "Ongoing" | "Resolved";
  description?: string | null;
  notes?: string | null;
  curedDate?: string | null;
  createdAt: string;
  updatedAt: string;
  medicationsId: number[];
};

type ApiMedicationResponse = {
  id: number;
  illnessId: number;
  medicationName: string;
  dosage?: string | null;
  instructions?: string | null;
  startDate: string;
  endDate?: string | null;
  frequencyInDays: number;
  times: string[];
  reminderEnabled: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type ApiSpeciesResponse = {
  id: number;
  code: string;
  name: string;
};

type ApiBreedResponse = {
  id: number;
  speciesId: number;
  species: string;
  name: string;
};

type ApiVetPlaceResponse = {
  id: string;
  name: string;
};

export type VetOption = {
  Id: string;
  Name: string;
};

export function parseRoutePayload<T>(payload?: unknown): T | null {
  if (!payload) return null;

  if (typeof payload !== "string") {
    return payload as T;
  }

  try {
    return JSON.parse(decodeURIComponent(payload)) as T;
  } catch {
    try {
      return JSON.parse(payload) as T;
    } catch {
      return null;
    }
  }
}

export function mapApiUserToModel(user: ApiUserResponse): AppUsersModel {
  return {
    Id: user.id,
    Name: user.name || `${user.firstName} ${user.lastName}`.trim(),
    FirstName: user.firstName,
    LastName: user.lastName,
    Email: user.email,
    PhoneNumber: user.phoneNumber,
    PasswordHash: "",
    Image: resolveApiUrl(user.image ?? null),
    CreatedAt: user.createdAt,
    LastLogin: user.lastLogin ?? null,
    Description: user.description ?? "",
    BookmarkedPostID: [],
  };
}

export function mapApiPetToModel(pet: ApiPetResponse): PetModel {
  return {
    Id: pet.id,
    UserId: pet.userId,
    Name: pet.name,
    SpeciesId: pet.speciesId,
    BreedId: pet.breedId ?? null,
    Sex: pet.sex === "Female" ? "Female" : "Male",
    BirthDate: pet.birthDate ?? null,
    WeightKg: pet.weightKg ?? null,
    Color: pet.color,
    Neutered: pet.neutered,
    AvatarUrl: resolveApiUrl(pet.avatarUrl ?? null),
    Notes: pet.notes ?? "",
    CreatedAt: pet.createdAt,
    UpdatedAt: pet.updatedAt,
    Species: pet.species.toLowerCase(),
    Breed: pet.breed ?? null,
    ConsultationsId: [],
  };
}

export function mapApiConsultationToModel(
  consultation: ApiConsultationResponse,
): ConsultationModel {
  return {
    Id: String(consultation.id),
    PetId: consultation.petId,
    VetId: consultation.vetPlaceId ?? "",
    VetName: consultation.vetName ?? null,
    Date: new Date(consultation.date),
    Details: consultation.details,
  };
}

export function mapApiVaccineToModel(
  vaccine: ApiVaccineResponse,
): VaccineRecordModel {
  return {
    Id: String(vaccine.id),
    petId: vaccine.petId,
    vaccineName: vaccine.vaccineName,
    status: vaccine.status === "NotDone" ? "Not Done" : vaccine.status,
    dateAdministered: vaccine.dateAdministered
      ? new Date(vaccine.dateAdministered)
      : undefined,
    nextDueDate: vaccine.nextDueDate ? new Date(vaccine.nextDueDate) : undefined,
    notes: vaccine.notes ?? undefined,
    veterinarian: vaccine.veterinarian ?? undefined,
    createdAt: new Date(vaccine.createdAt),
    updatedAt: new Date(vaccine.updatedAt),
  };
}

export function mapApiIllnessToModel(
  illness: ApiIllnessResponse,
): IllnessRecordModel {
  return {
    Id: String(illness.id),
    petId: illness.petId,
    illnessName: illness.illnessName,
    diagnosisDate: new Date(illness.diagnosisDate),
    medicationsId: illness.medicationsId.map(String),
    status: illness.status,
    description: illness.description ?? undefined,
    notes: illness.notes ?? undefined,
    curedDate: illness.curedDate ? new Date(illness.curedDate) : undefined,
    createdAt: new Date(illness.createdAt),
    updatedAt: new Date(illness.updatedAt),
  };
}

export function mapApiMedicationToModel(
  medication: ApiMedicationResponse,
): MedicationRecordModel {
  return {
    Id: String(medication.id),
    illnessId: String(medication.illnessId),
    medicationName: medication.medicationName,
    dosage: medication.dosage ?? undefined,
    instructions: medication.instructions ?? undefined,
    startDate: new Date(medication.startDate),
    endDate: medication.endDate ? new Date(medication.endDate) : undefined,
    frequencyInDays: medication.frequencyInDays,
    times: medication.times ?? [],
    reminderEnabled: medication.reminderEnabled,
    isActive: medication.isActive,
    createdAt: new Date(medication.createdAt),
    updatedAt: new Date(medication.updatedAt),
  };
}

export function mapApiSpeciesToModel(species: ApiSpeciesResponse): SpeciesModel {
  return {
    id: species.id,
    Code: species.code,
    Name: species.name,
    Breeds: [],
  };
}

export function mapApiBreedToModel(breed: ApiBreedResponse): BreedModel {
  return {
    id: breed.id,
    SpeciesId: breed.speciesId,
    Name: breed.name,
    Species: breed.species,
  };
}

export function toApiPetSex(value?: string | null) {
  if (value === "Female") return "Female";
  return "Male";
}

export function toApiPetColor(value?: string | null) {
  if (!value) return "Unknown";

  const normalized = value.trim().toLowerCase();
  if (normalized === "calico") return "Calico";
  if (normalized === "orange") return "Orange";
  if (normalized === "black") return "Black";
  if (normalized === "white") return "White";
  return "Unknown";
}

export function toApiVaccineStatus(value?: string | null) {
  if (value === "Done") return "Done";
  if (value === "Due") return "Due";
  return "NotDone";
}

export function toApiIllnessStatus(value?: string | null) {
  return value === "Resolved" ? "Resolved" : "Ongoing";
}

export async function fetchPetById(petId: string) {
  const response = await apiRequest<ApiPetResponse>(`/api/Pets/${petId}`);
  return mapApiPetToModel(response);
}

export async function fetchPetConsultations(petId: string) {
  const response = await apiRequest<ApiConsultationResponse[]>(
    `/api/Pets/${petId}/consultations`,
  );
  return response.map(mapApiConsultationToModel);
}

export async function fetchConsultationById(id: string | number) {
  const response = await apiRequest<ApiConsultationResponse>(
    `/api/Consultations/${id}`,
  );
  return mapApiConsultationToModel(response);
}

export async function fetchPetVaccines(petId: string) {
  const response = await apiRequest<ApiVaccineResponse[]>(
    `/api/Vaccines/pet/${petId}`,
  );
  return response.map(mapApiVaccineToModel);
}

export async function fetchDueVaccines() {
  const response = await apiRequest<ApiVaccineResponse[]>("/api/Vaccines/due");
  return response.map(mapApiVaccineToModel);
}

export async function fetchPetIllnesses(petId: string) {
  const response = await apiRequest<ApiIllnessResponse[]>(
    `/api/Illnesses/pet/${petId}`,
  );
  return response.map(mapApiIllnessToModel);
}

export async function fetchOngoingIllnesses() {
  const response = await apiRequest<ApiIllnessResponse[]>("/api/Illnesses/ongoing");
  return response.map(mapApiIllnessToModel);
}

export async function fetchIllnessMedications(illnessId: string | number) {
  const response = await apiRequest<ApiMedicationResponse[]>(
    `/api/Medications/illness/${illnessId}`,
  );
  return response.map(mapApiMedicationToModel);
}

export async function fetchMedicationReminders() {
  const response = await apiRequest<ApiMedicationResponse[]>(
    "/api/Medications/active",
  );
  return response.map((medication) =>
    normalizeMedicationReminderRecord(mapApiMedicationToModel(medication)),
  );
}

export async function fetchUpcomingConsultations() {
  const response = await apiRequest<ApiConsultationResponse[]>(
    "/api/Consultations/upcoming",
  );
  return response.map(mapApiConsultationToModel);
}

export async function fetchSpeciesOptions() {
  const response = await apiRequest<ApiSpeciesResponse[]>("/api/meta/species");
  return response.map(mapApiSpeciesToModel);
}

export async function fetchBreedOptions(speciesId?: number | null) {
  const query =
    typeof speciesId === "number" ? `?speciesId=${speciesId}` : "";
  const response = await apiRequest<ApiBreedResponse[]>(
    `/api/meta/breeds${query}`,
  );
  return response.map(mapApiBreedToModel);
}

export async function fetchVetOptions() {
  const response = await apiRequest<ApiVetPlaceResponse[]>("/api/Places/vets");
  return response.map((item) => ({
    Id: item.id,
    Name: item.name,
  }));
}

function buildImageFormData(asset: ImagePicker.ImagePickerAsset) {
  const formData = new FormData();
  const extension = asset.fileName?.split(".").pop() || "jpg";
  const name = asset.fileName || `upload.${extension}`;
  const type = asset.mimeType || "image/jpeg";

  formData.append("file", {
    uri: asset.uri,
    name,
    type,
  } as any);

  return formData;
}

export async function uploadUserAvatar(asset: ImagePicker.ImagePickerAsset) {
  return apiRequest<{ avatarUrl: string }>("/api/Users/avatar", {
    method: "POST",
    body: buildImageFormData(asset),
  });
}

export async function uploadPetAvatar(
  petId: string,
  asset: ImagePicker.ImagePickerAsset,
) {
  return apiRequest<{ avatarUrl: string }>(`/api/Pets/${petId}/avatar`, {
    method: "POST",
    body: buildImageFormData(asset),
  });
}
