import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppUsersModel, PetModel } from "@/data/models";
import { showSoftErrorNotice } from "@/lib/soft-error-notice";
import Constants from "expo-constants";
import { Platform } from "react-native";

const API_PORT = "5063";
const API_REQUEST_TIMEOUT_MS = 8000;
const ACCESS_TOKEN_KEY = "access_token";
const USER_ID_KEY = "user_id";
const LAST_OPENED_AT_KEY = "auth_last_opened_at";
const CACHED_PROFILE_KEY = "cached_profile";
const CACHED_PETS_KEY = "cached_pets";
const PROFILE_CACHE_UPDATED_AT_KEY = "profile_cache_updated_at";

type UnauthorizedHandler = (() => void | Promise<void>) | null;

type ApiErrorPayload = {
  errors?: string[] | Record<string, string[]>;
  message?: string;
  detail?: string;
  title?: string;
  status?: number;
  type?: string;
};

export type AuthSession = {
  accessToken: string;
  userId: number;
};

let unauthorizedHandler: UnauthorizedHandler = null;

export class ApiRequestError extends Error {
  status: number;
  payload: ApiErrorPayload | null;
  rawBody: string;

  constructor(
    message: string,
    options: {
      status: number;
      payload: ApiErrorPayload | null;
      rawBody: string;
    },
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.status = options.status;
    this.payload = options.payload;
    this.rawBody = options.rawBody;
  }
}

function removeTrailingSlash(url: string) {
  return url.replace(/\/+$/, "");
}

function getDefaultApiBaseUrl() {
  if (Platform.OS === "android") {
    return `http://10.0.2.2:${API_PORT}`;
  }

  return `http://localhost:${API_PORT}`;
}

function normalizeApiBaseUrl(url?: string | null) {
  if (!url) return null;

  const trimmed = url.trim();

  if (!trimmed) return null;

  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `http://${trimmed}`;

  if (Platform.OS === "android") {
    return removeTrailingSlash(
      withScheme.replace("://localhost", "://10.0.2.2"),
    );
  }

  return removeTrailingSlash(withScheme);
}

function extractHostFromHostUri(hostUri?: string | null) {
  if (!hostUri) return null;

  const withoutScheme = hostUri.trim().replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
  const authority = withoutScheme.split("/")[0] ?? "";
  const hostAndPort = authority.includes("@")
    ? authority.split("@").at(-1) ?? ""
    : authority;

  if (!hostAndPort) return null;

  if (hostAndPort.startsWith("[")) {
    const closingBracketIndex = hostAndPort.indexOf("]");
    return closingBracketIndex >= 0
      ? hostAndPort.slice(1, closingBracketIndex)
      : null;
  }

  return hostAndPort.split(":")[0] ?? null;
}

function getExpoHostApiBaseUrl() {
  const expoHost = extractHostFromHostUri(
    Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost,
  );

  if (!expoHost || expoHost === "localhost" || expoHost === "127.0.0.1") {
    return null;
  }

  return normalizeApiBaseUrl(`http://${expoHost}:${API_PORT}`);
}

function dedupeApiBaseUrls(urls: (string | null | undefined)[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const url of urls) {
    if (!url || seen.has(url)) continue;
    seen.add(url);
    result.push(url);
  }

  return result;
}

function getApiBaseUrlCandidates() {
  return dedupeApiBaseUrls([
    normalizeApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL),
    normalizeApiBaseUrl(Constants.expoConfig?.extra?.apiBaseUrl),
    getExpoHostApiBaseUrl(),
    getDefaultApiBaseUrl(),
  ]);
}

function buildApiUrl(baseUrl: string, path?: string | null) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;

  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function extractApiErrorMessage(payload: ApiErrorPayload | null) {
  if (!payload) return null;

  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    return payload.errors.join(" ");
  }

  if (payload.errors && typeof payload.errors === "object") {
    const validationMessages = Object.values(payload.errors).flat();
    if (validationMessages.length > 0) {
      return validationMessages.join(" ");
    }
  }

  return payload.message ?? payload.detail ?? payload.title ?? null;
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = API_REQUEST_TIMEOUT_MS,
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  const externalSignal = init.signal;
  const abortFromExternalSignal = () => controller.abort();

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener("abort", abortFromExternalSignal, {
        once: true,
      });
    }
  }

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener("abort", abortFromExternalSignal);
  }
}

export const API_BASE_URL = getApiBaseUrlCandidates()[0] ?? getDefaultApiBaseUrl();

let activeApiBaseUrl = API_BASE_URL;

function getOrderedApiBaseUrls() {
  return dedupeApiBaseUrls([activeApiBaseUrl, ...getApiBaseUrlCandidates()]);
}

export function setUnauthorizedHandler(handler: UnauthorizedHandler) {
  unauthorizedHandler = handler;
}

export async function saveAuthSession(session: AuthSession) {
  await AsyncStorage.multiSet([
    [ACCESS_TOKEN_KEY, session.accessToken],
    [USER_ID_KEY, String(session.userId)],
  ]);
}

export async function clearAuthSession() {
  await AsyncStorage.multiRemove([
    ACCESS_TOKEN_KEY,
    USER_ID_KEY,
    LAST_OPENED_AT_KEY,
    CACHED_PROFILE_KEY,
    CACHED_PETS_KEY,
    PROFILE_CACHE_UPDATED_AT_KEY,
  ]);
}

export async function getAuthSession() {
  const [[, accessToken], [, userIdValue]] = await AsyncStorage.multiGet([
    ACCESS_TOKEN_KEY,
    USER_ID_KEY,
  ]);

  if (!accessToken || !userIdValue) {
    return null;
  }

  const userId = Number(userIdValue);

  if (!Number.isFinite(userId)) {
    return null;
  }

  return {
    accessToken,
    userId,
  };
}

export async function getAccessToken() {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function getStoredUserId() {
  const value = await AsyncStorage.getItem(USER_ID_KEY);
  return value ? Number(value) : null;
}

export async function saveLastOpenedAt(timestamp: number) {
  await AsyncStorage.setItem(LAST_OPENED_AT_KEY, String(timestamp));
}

export async function getLastOpenedAt() {
  const value = await AsyncStorage.getItem(LAST_OPENED_AT_KEY);
  if (!value) return null;

  const timestamp = Number(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export async function saveCachedProfile(profile: AppUsersModel | null) {
  if (!profile) {
    await AsyncStorage.removeItem(CACHED_PROFILE_KEY);
    return;
  }

  await AsyncStorage.setItem(CACHED_PROFILE_KEY, JSON.stringify(profile));
}

export async function getCachedProfile() {
  const value = await AsyncStorage.getItem(CACHED_PROFILE_KEY);
  if (!value) return null;

  try {
    return JSON.parse(value) as AppUsersModel;
  } catch {
    await AsyncStorage.removeItem(CACHED_PROFILE_KEY);
    return null;
  }
}

export async function saveCachedPets(pets: PetModel[]) {
  await AsyncStorage.setItem(CACHED_PETS_KEY, JSON.stringify(pets));
}

export async function getCachedPets() {
  const value = await AsyncStorage.getItem(CACHED_PETS_KEY);
  if (!value) return [];

  try {
    return JSON.parse(value) as PetModel[];
  } catch {
    await AsyncStorage.removeItem(CACHED_PETS_KEY);
    return [];
  }
}

export async function saveProfileCacheUpdatedAt(timestamp: number | null) {
  if (timestamp === null) {
    await AsyncStorage.removeItem(PROFILE_CACHE_UPDATED_AT_KEY);
    return;
  }

  await AsyncStorage.setItem(PROFILE_CACHE_UPDATED_AT_KEY, String(timestamp));
}

export async function getProfileCacheUpdatedAt() {
  const value = await AsyncStorage.getItem(PROFILE_CACHE_UPDATED_AT_KEY);
  if (!value) return null;

  const timestamp = Number(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function resolveApiUrl(path?: string | null) {
  return buildApiUrl(activeApiBaseUrl, path);
}

export function resolveApiUrlWithCacheBust(
  path?: string | null,
  cacheKey?: string | number | null,
) {
  const resolved = resolveApiUrl(path);

  if (!resolved) {
    return "";
  }

  if (cacheKey === undefined || cacheKey === null || cacheKey === "") {
    return resolved;
  }

  const separator = resolved.includes("?") ? "&" : "?";
  return `${resolved}${separator}cb=${encodeURIComponent(String(cacheKey))}`;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  const isFormData =
    typeof FormData !== "undefined" && init.body instanceof FormData;

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response | null = null;
  let resolvedUrl = "";
  let lastNetworkError: unknown = null;
  const attemptedUrls: string[] = [];

  // Try emulator, simulator, and LAN-friendly hosts until one is reachable.
  for (const baseUrl of getOrderedApiBaseUrls()) {
    const url = buildApiUrl(baseUrl, path);
    attemptedUrls.push(url);

    try {
      response = await fetchWithTimeout(url, {
        ...init,
        headers,
      });
      resolvedUrl = url;
      activeApiBaseUrl = baseUrl;
      break;
    } catch (error) {
      lastNetworkError = error;

      console.warn("[apiRequest] Network failure", {
        url,
        method: init.method ?? "GET",
        error: isAbortError(error)
          ? `Request timed out after ${API_REQUEST_TIMEOUT_MS}ms`
          : error,
      });
    }
  }

  if (!response) {
    const localhostHint = attemptedUrls.some(
      (url) => url.includes("localhost") || url.includes("10.0.2.2"),
    )
      ? " This usually means the app cannot reach your computer's localhost. On Android emulator use 10.0.2.2, and on a physical device use your computer's LAN IP."
      : "";

    console.error("[apiRequest] All API base URLs failed", {
      path,
      method: init.method ?? "GET",
      attemptedUrls,
      error: lastNetworkError,
    });
    showSoftErrorNotice();
    throw new ApiRequestError(
      `Network request failed while calling ${path}. Tried: ${attemptedUrls.join(", ")}.${localhostHint}`,
      {
        status: 0,
        payload: null,
        rawBody: "",
      },
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  const rawBody = response.status === 204 ? "" : await response.text();
  const isJsonResponse = contentType.includes("application/json");

  console.log("[apiRequest] Response received", {
    url: resolvedUrl,
    method: init.method ?? "GET",
    status: response.status,
    ok: response.ok,
    contentType,
    bodyPreview: rawBody.slice(0, 300),
  });

  let parsedBody: unknown = null;

  if (rawBody) {
    if (isJsonResponse) {
      try {
        parsedBody = JSON.parse(rawBody);
      } catch {
        console.error("[apiRequest] Invalid JSON response", {
          url: resolvedUrl,
          status: response.status,
          contentType,
          rawBody,
        });
        throw new ApiRequestError(
          `The server returned invalid JSON for ${path}. Status: ${response.status}.`,
          {
            status: response.status,
            payload: null,
            rawBody,
          },
        );
      }
    } else {
      parsedBody = rawBody;
    }
  }

  if (!response.ok) {
    const payload =
      parsedBody && typeof parsedBody === "object"
        ? (parsedBody as ApiErrorPayload)
        : null;

    const detail =
      extractApiErrorMessage(payload) ||
      (typeof parsedBody === "string" && parsedBody.trim()) ||
      `Request failed with status ${response.status}.`;

    console.error("[apiRequest] Request failed", {
      url: resolvedUrl,
      method: init.method ?? "GET",
      status: response.status,
      detail,
      parsedBody,
      rawBody,
    });

    if (response.status === 401 && token && unauthorizedHandler) {
      void unauthorizedHandler();
    }

    throw new ApiRequestError(detail, {
      status: response.status,
      payload,
      rawBody,
    });
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (!rawBody) {
    return undefined as T;
  }

  if (!isJsonResponse) {
    console.error("[apiRequest] Unexpected content type", {
      url: resolvedUrl,
      status: response.status,
      contentType,
      rawBody,
    });
    throw new ApiRequestError(
      `Expected JSON but received '${contentType || "unknown content type"}' from ${path}.`,
      {
        status: response.status,
        payload: null,
        rawBody,
      },
    );
  }

  return parsedBody as T;
}
