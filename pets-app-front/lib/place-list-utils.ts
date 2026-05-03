import { PlaceModel, PlaceScheduleModel } from "@/data/models";

export type PlaceFilter = "openToday" | "highlyRated" | "reviewed";
export type PlaceSortOrder = "popular" | "atoz" | "ztoa";

const DAY_OPTIONS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

function normalizeDayIndex(value: string | number): number | null {
  if (typeof value === "number" && value >= 0 && value < DAY_OPTIONS.length) {
    return value;
  }

  const normalizedValue = String(value).trim().toLowerCase();
  const index = DAY_OPTIONS.findIndex(
    (day) => day.toLowerCase() === normalizedValue,
  );

  return index >= 0 ? index : null;
}

function getTodayIndex(date = new Date()) {
  return (date.getDay() + 6) % 7;
}

function isOpenToday(schedule: PlaceScheduleModel[], date = new Date()) {
  const todayIndex = getTodayIndex(date);
  const todaySchedule = schedule.find(
    (entry) => normalizeDayIndex(entry.DayOfWeek) === todayIndex,
  );

  return Boolean(
    todaySchedule &&
      !todaySchedule.IsClosed &&
      todaySchedule.OpenTime &&
      todaySchedule.CloseTime,
  );
}

function matchesSearchTerm(place: PlaceModel, searchTerm: string) {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  if (!normalizedSearchTerm) {
    return true;
  }

  return [place.Name, place.City, place.Country]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(normalizedSearchTerm));
}

function matchesFilters(place: PlaceModel, filters: PlaceFilter[]) {
  return filters.every((filter) => {
    if (filter === "openToday") {
      return place.Status === "Active" && isOpenToday(place.Schedule ?? []);
    }

    if (filter === "highlyRated") {
      return (place.AverageRating ?? 0) >= 4;
    }

    if (filter === "reviewed") {
      return (place.ReviewsCount ?? 0) > 0;
    }

    return true;
  });
}

function sortPlaces(places: PlaceModel[], sortOrder: PlaceSortOrder) {
  const nextPlaces = [...places];

  switch (sortOrder) {
    case "atoz":
      return nextPlaces.sort((a, b) => a.Name.localeCompare(b.Name));
    case "ztoa":
      return nextPlaces.sort((a, b) => b.Name.localeCompare(a.Name));
    case "popular":
    default:
      return nextPlaces.sort((a, b) => {
        const reviewDifference = (b.ReviewsCount ?? 0) - (a.ReviewsCount ?? 0);

        if (reviewDifference !== 0) {
          return reviewDifference;
        }

        const ratingDifference = (b.AverageRating ?? 0) - (a.AverageRating ?? 0);

        if (ratingDifference !== 0) {
          return ratingDifference;
        }

        return a.Name.localeCompare(b.Name);
      });
  }
}

export function getDisplayedPlaces({
  places,
  searchTerm,
  filters,
  sortOrder,
}: {
  places: PlaceModel[];
  searchTerm: string;
  filters: PlaceFilter[];
  sortOrder: PlaceSortOrder;
}) {
  return sortPlaces(
    places.filter(
      (place) => matchesSearchTerm(place, searchTerm) && matchesFilters(place, filters),
    ),
    sortOrder,
  );
}
