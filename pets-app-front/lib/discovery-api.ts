import { PlaceModel, PlaceScheduleModel } from "@/data/models";
import { apiRequest, resolveApiUrl } from "@/lib/api";

type ApiPlaceScheduleResponse = {
  id: number;
  dayOfWeek: string | number;
  isClosed: boolean;
  openTime?: string | null;
  closeTime?: string | null;
  breakStartTime?: string | null;
  breakEndTime?: string | null;
};

type ApiPlaceResponse = {
  id: string;
  ownerUserId?: number | null;
  name: string;
  phone: string;
  email: string;
  photo?: string | null;
  description?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  country: string;
  status: "Active" | "Inactive" | "Closed";
  type: "Vet" | "PetShop" | "Other";
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
  schedule?: ApiPlaceScheduleResponse[] | null;
  averageRating?: number | null;
  reviewsCount?: number;
};

type PlaceType = ApiPlaceResponse["type"];

function mapApiPlaceScheduleToModel(
  schedule: ApiPlaceScheduleResponse,
): PlaceScheduleModel {
  return {
    Id: String(schedule.id),
    DayOfWeek: schedule.dayOfWeek,
    IsClosed: schedule.isClosed,
    OpenTime: schedule.openTime ?? null,
    CloseTime: schedule.closeTime ?? null,
    BreakStartTime: schedule.breakStartTime ?? null,
    BreakEndTime: schedule.breakEndTime ?? null,
  };
}

export function mapApiPlaceToModel(place: ApiPlaceResponse): PlaceModel {
  return {
    Id: place.id,
    OwnerUserId: place.ownerUserId ?? null,
    Name: place.name,
    Phone: place.phone,
    Email: place.email,
    Photo: resolveApiUrl(place.photo ?? null),
    Description: place.description ?? "",
    AddressLine1: place.addressLine1,
    AddressLine2: place.addressLine2 ?? null,
    City: place.city,
    Country: place.country,
    Status: place.status,
    Type: place.type,
    Latitude: place.latitude ?? null,
    Longitude: place.longitude ?? null,
    CreatedAt: place.createdAt,
    Schedule: (place.schedule ?? []).map(mapApiPlaceScheduleToModel),
    AverageRating:
      typeof place.averageRating === "number" ? place.averageRating : null,
    ReviewsCount:
      typeof place.reviewsCount === "number" ? place.reviewsCount : 0,
  };
}

async function fetchPlaces(path: string) {
  const response = await apiRequest<ApiPlaceResponse[]>(path);
  return response.map(mapApiPlaceToModel);
}

export async function fetchPlacesByType(type: PlaceType) {
  return fetchPlaces(`/api/Places?type=${encodeURIComponent(type)}`);
}

export async function fetchVets() {
  return fetchPlaces("/api/Places/vets");
}

export async function fetchPetShops() {
  return fetchPlaces("/api/Places/pet-shops");
}

export async function fetchCharityOrganisations() {
  return fetchPlacesByType("Other");
}

export async function fetchPlaceById(id: string) {
  const response = await apiRequest<ApiPlaceResponse>(`/api/Places/${id}`);
  return mapApiPlaceToModel(response);
}

export function formatPlaceLocation(place: Pick<PlaceModel, "City" | "Country">) {
  return [place.City, place.Country].filter(Boolean).join(", ");
}

export function formatPlaceAddress(
  place: Pick<PlaceModel, "AddressLine1" | "AddressLine2" | "City" | "Country">,
) {
  return [
    place.AddressLine1,
    place.AddressLine2,
    place.City,
    place.Country,
  ]
    .filter(Boolean)
    .join(", ");
}
