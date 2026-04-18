import { PlaceModel } from "@/data/models";
import { apiRequest, resolveApiUrl } from "@/lib/api";

type ApiPlaceResponse = {
  id: string;
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
};

type PlaceType = ApiPlaceResponse["type"];

export function mapApiPlaceToModel(place: ApiPlaceResponse): PlaceModel {
  return {
    Id: place.id,
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
