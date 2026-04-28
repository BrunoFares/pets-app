import * as ImagePicker from "expo-image-picker";
import { PlaceOwnerApplicationModel } from "@/data/models";
import { ApiRequestError, apiRequest, resolveApiUrl } from "@/lib/api";
import { mapApiPlaceToModel } from "@/lib/discovery-api";

export const MAX_PLACE_IMAGES = 5;

type ApiUploadedImageResponse = {
  id: number | string;
  url: string;
  createdAt: string;
};

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
  requestedPlaceType: "Vet" | "PetShop" | "Charity" | "Other";
  status: "Pending" | "Approved" | "Rejected";
  rejectionReason?: string | null;
  adminNotes?: string | null;
  reviewedByAdminId?: number | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  images?: ApiUploadedImageResponse[] | null;
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
  type: "Vet" | "PetShop" | "Charity" | "Other";
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
  images?: ApiUploadedImageResponse[] | null;
  schedule?: ApiPlaceScheduleResponse[] | null;
  averageRating?: number | null;
  reviewsCount?: number;
};

type ApiCurrentUserAccessResponse = {
  isApprovedPlaceOwner?: boolean;
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
  requestedPlaceType: "Vet" | "PetShop" | "Charity" | "Other";
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
  type: "Vet" | "PetShop" | "Charity" | "Other";
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
    Images: (application.images ?? []).map((image) => ({
      Id: image.id,
      Url: resolveApiUrl(image.url),
      CreatedAt: image.createdAt,
    })),
  };
}

function normalizeTimeForApi(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const match = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.exec(trimmed);
  if (!match) {
    return trimmed;
  }

  return `${match[1]}:${match[2]}:${match[3] ?? "00"}`;
}

function buildPlaceImagesFormData(assets: ImagePicker.ImagePickerAsset[]) {
  const formData = new FormData();

  for (const [index, asset] of assets.entries()) {
    const normalizedMimeType = asset.mimeType?.toLowerCase();
    const extensionFromMimeType =
      normalizedMimeType === "image/png"
        ? "png"
        : normalizedMimeType === "image/webp"
          ? "webp"
          : "jpg";
    const extensionFromFileName =
      asset.fileName?.split(".").pop()?.toLowerCase() ?? "";
    const extension =
      extensionFromFileName === "png" || extensionFromFileName === "webp"
        ? extensionFromFileName
        : extensionFromFileName === "jpg" || extensionFromFileName === "jpeg"
          ? "jpg"
          : extensionFromMimeType;
    const type =
      extension === "png"
        ? "image/png"
        : extension === "webp"
          ? "image/webp"
          : "image/jpeg";
    const name =
      asset.fileName?.trim() || `place-image-${index + 1}.${extension}`;

    formData.append("files", {
      uri: asset.uri,
      name,
      type,
    } as any);
  }

  return formData;
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
      openTime: entry.isClosed ? null : normalizeTimeForApi(entry.openTime),
      closeTime: entry.isClosed ? null : normalizeTimeForApi(entry.closeTime),
      breakStartTime: entry.isClosed
        ? null
        : normalizeTimeForApi(entry.breakStartTime),
      breakEndTime: entry.isClosed
        ? null
        : normalizeTimeForApi(entry.breakEndTime),
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

export async function fetchMyPlaceOwnerAccessStatus() {
  const response = await apiRequest<ApiCurrentUserAccessResponse>(
    "/api/Users/me",
  );

  return response.isApprovedPlaceOwner ?? false;
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

export async function fetchOwnedPlaces(ownerUserId?: string | number | null) {
  try {
    const response = await apiRequest<ApiPlaceResponse[]>("/api/Places/mine");
    return response.map(mapApiPlaceToModel);
  } catch (error) {
    if (!(error instanceof ApiRequestError) || error.status !== 404) {
      throw error;
    }

    if (ownerUserId === undefined || ownerUserId === null) {
      return [];
    }

    const fallbackResponse = await apiRequest<ApiPlaceResponse[]>("/api/Places");

    return fallbackResponse
      .filter(
        (place) => String(place.ownerUserId ?? "") === String(ownerUserId),
      )
      .map(mapApiPlaceToModel);
  }
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

export async function uploadManagedPlaceImages(
  placeId: string,
  assets: ImagePicker.ImagePickerAsset[],
) {
  if (assets.length === 0) {
    return [];
  }

  return apiRequest<ApiUploadedImageResponse[]>(`/api/Places/${placeId}/images`, {
    method: "POST",
    body: buildPlaceImagesFormData(assets),
  });
}

export async function uploadPlaceOwnerApplicationImages(
  assets: ImagePicker.ImagePickerAsset[],
) {
  if (assets.length === 0) {
    return [];
  }

  return apiRequest<ApiUploadedImageResponse[]>("/api/place-owner-applications/me/images", {
    method: "POST",
    body: buildPlaceImagesFormData(assets),
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
