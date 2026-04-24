import { PlaceModel, PlaceOwnerApplicationModel } from "@/data/models";
import { ApiRequestError, apiRequest } from "@/lib/api";
import { mapApiPlaceToModel } from "@/lib/discovery-api";

type ApiPlaceOwnerApplicationResponse = {
  id: number;
  userId: number;
  businessName: string;
  phone: string;
  email: string;
  description?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  country: string;
  requestedPlaceType: "Vet" | "PetShop" | "Other";
  status: "Pending" | "Approved" | "Rejected";
  rejectionReason?: string | null;
  adminNotes?: string | null;
  reviewedByAdminId?: number | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

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

export type PlaceOwnerApplicationInput = {
  businessName: string;
  phone: string;
  email: string;
  description?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  country: string;
  requestedPlaceType: "Vet" | "PetShop" | "Other";
};

export type ManagedPlaceScheduleInput = {
  dayOfWeek: string;
  isClosed: boolean;
  openTime?: string | null;
  closeTime?: string | null;
  breakStartTime?: string | null;
  breakEndTime?: string | null;
};

export type ManagedPlaceInput = {
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
  schedule: ManagedPlaceScheduleInput[];
};

function mapApiPlaceOwnerApplicationToModel(
  application: ApiPlaceOwnerApplicationResponse,
): PlaceOwnerApplicationModel {
  return {
    Id: application.id,
    UserId: application.userId,
    BusinessName: application.businessName,
    Phone: application.phone,
    Email: application.email,
    Description: application.description ?? null,
    AddressLine1: application.addressLine1,
    AddressLine2: application.addressLine2 ?? null,
    City: application.city,
    Country: application.country,
    RequestedPlaceType: application.requestedPlaceType,
    Status: application.status,
    RejectionReason: application.rejectionReason ?? null,
    AdminNotes: application.adminNotes ?? null,
    ReviewedByAdminId: application.reviewedByAdminId ?? null,
    ReviewedAt: application.reviewedAt ?? null,
    CreatedAt: application.createdAt,
    UpdatedAt: application.updatedAt,
  };
}

function toManagedPlacePayload(input: ManagedPlaceInput) {
  return {
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    photo: input.photo?.trim() || null,
    description: input.description?.trim() || null,
    addressLine1: input.addressLine1.trim(),
    addressLine2: input.addressLine2?.trim() || null,
    city: input.city.trim(),
    country: input.country.trim(),
    status: input.status,
    type: input.type,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    schedule: input.schedule.map((entry) => ({
      dayOfWeek: entry.dayOfWeek,
      isClosed: entry.isClosed,
      openTime: entry.isClosed ? null : entry.openTime ?? null,
      closeTime: entry.isClosed ? null : entry.closeTime ?? null,
      breakStartTime: entry.isClosed ? null : entry.breakStartTime ?? null,
      breakEndTime: entry.isClosed ? null : entry.breakEndTime ?? null,
    })),
  };
}

export async function fetchMyPlaceOwnerApplication() {
  try {
    const response = await apiRequest<ApiPlaceOwnerApplicationResponse>(
      "/api/place-owner-applications/me",
    );

    return mapApiPlaceOwnerApplicationToModel(response);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function createPlaceOwnerApplication(
  input: PlaceOwnerApplicationInput,
) {
  const response = await apiRequest<ApiPlaceOwnerApplicationResponse>(
    "/api/place-owner-applications",
    {
      method: "POST",
      body: JSON.stringify({
        businessName: input.businessName.trim(),
        phone: input.phone.trim(),
        email: input.email.trim(),
        description: input.description?.trim() || null,
        addressLine1: input.addressLine1.trim(),
        addressLine2: input.addressLine2?.trim() || null,
        city: input.city.trim(),
        country: input.country.trim(),
        requestedPlaceType: input.requestedPlaceType,
      }),
    },
  );

  return mapApiPlaceOwnerApplicationToModel(response);
}

export async function fetchOwnedPlaces() {
  const response = await apiRequest<ApiPlaceResponse[]>("/api/Places/mine");
  return response.map(mapApiPlaceToModel);
}

export async function createManagedPlace(input: ManagedPlaceInput) {
  const response = await apiRequest<ApiPlaceResponse>("/api/Places", {
    method: "POST",
    body: JSON.stringify(toManagedPlacePayload(input)),
  });

  return mapApiPlaceToModel(response);
}

export async function updateManagedPlace(
  placeId: string,
  input: ManagedPlaceInput,
) {
  const response = await apiRequest<ApiPlaceResponse>(`/api/Places/${placeId}`, {
    method: "PUT",
    body: JSON.stringify(toManagedPlacePayload(input)),
  });

  return mapApiPlaceToModel(response);
}

export async function deleteManagedPlace(placeId: string) {
  await apiRequest(`/api/Places/${placeId}`, {
    method: "DELETE",
  });
}

export function getPlaceOwnerApplicationStatusTone(
  status: PlaceOwnerApplicationModel["Status"],
) {
  if (status === "Approved") return "approved";
  if (status === "Rejected") return "rejected";
  return "pending";
}

export function formatPlaceOwnerApplicationStatusLabel(
  status: PlaceOwnerApplicationModel["Status"],
) {
  if (status === "Approved") return "Approved";
  if (status === "Rejected") return "Rejected";
  return "Pending Review";
}
