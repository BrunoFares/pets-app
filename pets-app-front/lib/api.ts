import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";

const ACCESS_TOKEN_KEY = "access_token";
const USER_ID_KEY = "user_id";

type ApiErrorPayload = {
  errors?: string[] | Record<string, string[]>;
  message?: string;
};

export type AuthSession = {
  accessToken: string;
  userId: number;
};

function getDefaultApiBaseUrl() {
  if (Platform.OS === "android") {
    return "http://10.0.2.2:5063";
  }

  return "http://localhost:5063";
}

function normalizeApiBaseUrl(url?: string | null) {
  if (!url) return getDefaultApiBaseUrl();

  if (Platform.OS === "android") {
    return url.replace("://localhost", "://10.0.2.2");
  }

  return url;
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

  return payload.message ?? null;
}

export const API_BASE_URL =
  normalizeApiBaseUrl(
    process.env.EXPO_PUBLIC_API_BASE_URL ||
      Constants.expoConfig?.extra?.apiBaseUrl ||
      getDefaultApiBaseUrl(),
  );

export async function saveAuthSession(session: AuthSession) {
  await AsyncStorage.multiSet([
    [ACCESS_TOKEN_KEY, session.accessToken],
    [USER_ID_KEY, String(session.userId)],
  ]);
}

export async function clearAuthSession() {
  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, USER_ID_KEY]);
}

export async function getAccessToken() {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function getStoredUserId() {
  const value = await AsyncStorage.getItem(USER_ID_KEY);
  return value ? Number(value) : null;
}

export function resolveApiUrl(path?: string | null) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;

  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = resolveApiUrl(path);
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

  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      headers,
    });
  } catch (error) {
    const localhostHint = url.includes("localhost")
      ? " This usually means the app cannot reach your computer's localhost. On Android emulator use 10.0.2.2, and on a physical device use your computer's LAN IP."
      : "";

    console.error("[apiRequest] Network failure", {
      url,
      method: init.method ?? "GET",
      error,
    });
    throw new Error(
      `Network request failed while calling ${url}.${localhostHint}`,
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  const rawBody = response.status === 204 ? "" : await response.text();
  const isJsonResponse = contentType.includes("application/json");

  console.log("[apiRequest] Response received", {
    url,
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
          url,
          status: response.status,
          contentType,
          rawBody,
        });
        throw new Error(
          `The server returned invalid JSON for ${path}. Status: ${response.status}.`,
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
      url,
      method: init.method ?? "GET",
      status: response.status,
      detail,
      parsedBody,
      rawBody,
    });

    throw new Error(detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (!rawBody) {
    return undefined as T;
  }

  if (!isJsonResponse) {
    console.error("[apiRequest] Unexpected content type", {
      url,
      status: response.status,
      contentType,
      rawBody,
    });
    throw new Error(
      `Expected JSON but received '${contentType || "unknown content type"}' from ${path}.`,
    );
  }

  return parsedBody as T;
}
