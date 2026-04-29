import { ForumPostsModel, PlaceModel } from "@/data/models";
import {
  fetchCharityOrganisations,
  fetchPetShops,
  fetchPlacesByType,
  fetchVets,
} from "@/lib/discovery-api";

const PLACE_OWNER_CACHE_TTL_MS = 5 * 60 * 1000;

let cachedOwnerIds: Set<string> | null = null;
let cachedOwnerIdsExpiresAt = 0;
let pendingOwnerIdsPromise: Promise<Set<string>> | null = null;

function collectOwnerIds(placeGroups: PlaceModel[][]) {
  const ownerIds = new Set<string>();

  for (const places of placeGroups) {
    for (const place of places) {
      if (place.OwnerUserId === undefined || place.OwnerUserId === null) {
        continue;
      }

      ownerIds.add(String(place.OwnerUserId));
    }
  }

  return ownerIds;
}

export async function getRegisteredPlaceOwnerIds(options?: {
  forceRefresh?: boolean;
}) {
  const now = Date.now();

  if (
    !options?.forceRefresh &&
    cachedOwnerIds &&
    cachedOwnerIdsExpiresAt > now
  ) {
    return cachedOwnerIds;
  }

  if (!options?.forceRefresh && pendingOwnerIdsPromise) {
    return pendingOwnerIdsPromise;
  }

  pendingOwnerIdsPromise = Promise.allSettled([
    fetchVets(),
    fetchPetShops(),
    fetchCharityOrganisations(),
    fetchPlacesByType("Other"),
  ])
    .then((results) => {
      const placeGroups = results
        .filter(
          (result): result is PromiseFulfilledResult<PlaceModel[]> =>
            result.status === "fulfilled",
        )
        .map((result) => result.value);

      const ownerIds = collectOwnerIds(placeGroups);

      if (ownerIds.size > 0 || !cachedOwnerIds) {
        cachedOwnerIds = ownerIds;
      }

      cachedOwnerIdsExpiresAt = Date.now() + PLACE_OWNER_CACHE_TTL_MS;

      return cachedOwnerIds ?? ownerIds;
    })
    .catch((error) => {
      console.error("[forum] Unable to load registered place owners", error);
      return cachedOwnerIds ?? new Set<string>();
    })
    .finally(() => {
      pendingOwnerIdsPromise = null;
    });

  return pendingOwnerIdsPromise;
}

export function applyRegisteredPlaceFlag(
  post: ForumPostsModel,
  ownerIds: Set<string>,
): ForumPostsModel {
  return {
    ...post,
    HasRegisteredPlace: ownerIds.has(String(post.UserId)),
  };
}

export function applyRegisteredPlaceFlags(
  posts: ForumPostsModel[],
  ownerIds: Set<string>,
): ForumPostsModel[] {
  return posts.map((post) => applyRegisteredPlaceFlag(post, ownerIds));
}
