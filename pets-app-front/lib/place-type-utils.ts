export type SupportedPlaceType = "Vet" | "PetShop" | "Charity";

export function isCharityPlaceType(type?: string | null) {
  return type === "Charity" || type === "Other";
}

export function normalizePlaceTypeForSelection(
  type?: string | null,
): SupportedPlaceType {
  if (type === "PetShop" || type === "Charity" || type === "Vet") {
    return type;
  }

  if (type === "Other") {
    return "Charity";
  }

  return "Vet";
}

export function formatPlaceTypeLabel(type?: string | null) {
  if (type === "PetShop") {
    return "Pet Shop";
  }

  if (isCharityPlaceType(type)) {
    return "Charity";
  }

  if (type === "Vet") {
    return "Vet";
  }

  return "Other";
}
