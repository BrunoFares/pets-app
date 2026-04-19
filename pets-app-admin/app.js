const HAS_BROWSER_RUNTIME =
  typeof window !== "undefined" &&
  typeof document !== "undefined" &&
  typeof localStorage !== "undefined";

if (!HAS_BROWSER_RUNTIME) {
  const runtimeMessage =
    'pets-app-admin/app.js is a browser-only script. Start the backend with "dotnet run --project PetCare.Api/PetCare.Api/PetCare.Api.csproj" and open "http://localhost:5063/admin/" in your browser, or serve "pets-app-admin" with a local static server for standalone UI testing.';

  if (typeof console !== "undefined" && typeof console.error === "function") {
    console.error(runtimeMessage);
  }

  if (typeof process !== "undefined") {
    process.exitCode = 1;
  }
} else {
const DEFAULT_FALLBACK_API_BASE_URL = "http://localhost:5063";
const IS_SERVED_BY_BACKEND =
  window.location.protocol.startsWith("http") &&
  /^\/admin(\/|$)/.test(window.location.pathname);
const DEFAULT_API_BASE_URL = IS_SERVED_BY_BACKEND
  ? window.location.origin
  : DEFAULT_FALLBACK_API_BASE_URL;
const STORAGE_KEYS = {
  apiBaseUrl: "pets-admin.api-base-url",
  token: "pets-admin.access-token",
  userId: "pets-admin.user-id",
};

const state = {
  apiBaseUrl: IS_SERVED_BY_BACKEND
    ? normalizeApiBaseUrl(DEFAULT_API_BASE_URL)
    : normalizeApiBaseUrl(
        localStorage.getItem(STORAGE_KEYS.apiBaseUrl) || DEFAULT_API_BASE_URL,
      ),
  token: localStorage.getItem(STORAGE_KEYS.token) || "",
  userId: parseStoredNumber(localStorage.getItem(STORAGE_KEYS.userId)),
  me: null,
  places: [],
  editingPlaceId: null,
  createdUserSession: null,
  apiReachable: null,
  lastSyncAt: null,
  toastTimer: null,
};

const elements = {
  apiBaseUrlInput: document.querySelector("#apiBaseUrlInput"),
  apiStatus: document.querySelector("#apiStatus"),
  lastSyncLabel: document.querySelector("#lastSyncLabel"),
  tokenStatus: document.querySelector("#tokenStatus"),
  sidebarLogoutButton: document.querySelector("#sidebarLogoutButton"),
  mainLogoutButton: document.querySelector("#mainLogoutButton"),
  settingsForm: document.querySelector("#settingsForm"),
  loginForm: document.querySelector("#loginForm"),
  registerForm: document.querySelector("#registerForm"),
  placeForm: document.querySelector("#placeForm"),
  refreshAllButton: document.querySelector("#refreshAllButton"),
  refreshPlacesButton: document.querySelector("#refreshPlacesButton"),
  resetPlaceFormButton: document.querySelector("#resetPlaceFormButton"),
  placeSearchInput: document.querySelector("#placeSearchInput"),
  placeTypeFilter: document.querySelector("#placeTypeFilter"),
  placeStatusFilter: document.querySelector("#placeStatusFilter"),
  placesTableBody: document.querySelector("#placesTableBody"),
  placesEmptyState: document.querySelector("#placesEmptyState"),
  profileHeadline: document.querySelector("#profileHeadline"),
  profileSummary: document.querySelector("#profileSummary"),
  profileUserId: document.querySelector("#profileUserId"),
  profileEmail: document.querySelector("#profileEmail"),
  profileLastLogin: document.querySelector("#profileLastLogin"),
  createdUserPanel: document.querySelector("#createdUserPanel"),
  createdUserHeadline: document.querySelector("#createdUserHeadline"),
  createdUserMessage: document.querySelector("#createdUserMessage"),
  useCreatedSessionButton: document.querySelector("#useCreatedSessionButton"),
  placeFormMode: document.querySelector("#placeFormMode"),
  placeFormHint: document.querySelector("#placeFormHint"),
  toast: document.querySelector("#toast"),
  statTargets: document.querySelectorAll("[data-stat]"),
};

class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

function parseStoredNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeApiBaseUrl(url) {
  return (url || DEFAULT_API_BASE_URL).trim().replace(/\/+$/, "");
}

function getField(form, name) {
  return form.querySelector(`[name="${name}"]`);
}

function persistApiBaseUrl() {
  if (IS_SERVED_BY_BACKEND) {
    return;
  }

  localStorage.setItem(STORAGE_KEYS.apiBaseUrl, state.apiBaseUrl);
}

function persistSession() {
  if (state.token && state.userId !== null) {
    localStorage.setItem(STORAGE_KEYS.token, state.token);
    localStorage.setItem(STORAGE_KEYS.userId, String(state.userId));
    return;
  }

  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.userId);
}

function extractErrorMessage(payload) {
  if (!payload) return null;

  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message.trim();
  }

  if (typeof payload.detail === "string" && payload.detail.trim()) {
    return payload.detail.trim();
  }

  if (typeof payload.title === "string" && payload.title.trim()) {
    return payload.title.trim();
  }

  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    return payload.errors.join(" ");
  }

  if (payload.errors && typeof payload.errors === "object") {
    const combined = Object.values(payload.errors)
      .flat()
      .filter(Boolean)
      .join(" ");

    if (combined) return combined;
  }

  return null;
}

async function apiRequest(path, options = {}) {
  const url = `${state.apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");

  if (state.token) {
    headers.set("Authorization", `Bearer ${state.token}`);
  }

  let body = options.body;

  if (body !== undefined && body !== null && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(body);
  }

  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body,
  });

  const raw = await response.text();
  const payload = raw ? tryParseJson(raw) : null;

  if (!response.ok) {
    const message =
      extractErrorMessage(payload) ||
      `Request failed with status ${response.status}.`;
    throw new ApiError(message, response.status, payload);
  }

  return payload;
}

function tryParseJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setApiStatus(text, tone = "pending") {
  elements.apiStatus.textContent = text;
  elements.apiStatus.dataset.tone = tone;
}

function formatDateTime(value) {
  if (!value) return "Unknown";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function renderStats() {
  const stats = {
    totalPlaces: state.places.length,
    activePlaces: state.places.filter((place) => place.status === "Active").length,
    vetPlaces: state.places.filter((place) => place.type === "Vet").length,
    petShops: state.places.filter((place) => place.type === "PetShop").length,
  };

  elements.statTargets.forEach((target) => {
    const key = target.dataset.stat;
    target.textContent = String(stats[key] ?? 0);
  });
}

function renderConnection() {
  elements.lastSyncLabel.textContent = state.lastSyncAt
    ? formatDateTime(state.lastSyncAt)
    : "Not yet synced";

  elements.tokenStatus.textContent = state.token
    ? `Token stored for user #${state.userId ?? "?"}`
    : "No token stored";

  if (state.apiReachable === null) {
    setApiStatus("Waiting to connect", "pending");
    return;
  }

  if (!state.apiReachable) {
    setApiStatus("Unable to reach API", "danger");
    return;
  }

  setApiStatus("Connected", "success");
}

function renderSession() {
  const isSignedIn = Boolean(state.token && state.me);
  elements.sidebarLogoutButton.disabled = !state.token;
  elements.mainLogoutButton.disabled = !state.token;

  if (!isSignedIn) {
    elements.profileHeadline.textContent = "Guest mode";
    elements.profileSummary.textContent =
      state.token
        ? "A token is stored, but the profile could not be loaded. Please sign in again if this continues."
        : "Sign in to create or update places. Public endpoints will still load the directory list.";
    elements.profileUserId.textContent = state.userId ? String(state.userId) : "Not signed in";
    elements.profileEmail.textContent = "Not signed in";
    elements.profileLastLogin.textContent = "Unknown";
    return;
  }

  const displayName =
    state.me.name ||
    `${state.me.firstName || ""} ${state.me.lastName || ""}`.trim() ||
    state.me.username ||
    `User #${state.me.id}`;

  elements.profileHeadline.textContent = displayName;
  elements.profileSummary.textContent = `Signed in as ${state.me.username}. Protected place management is ready.`;
  elements.profileUserId.textContent = String(state.me.id);
  elements.profileEmail.textContent = state.me.email || "No email";
  elements.profileLastLogin.textContent = formatDateTime(state.me.lastLogin);
}

function renderCreatedUserPanel() {
  if (!state.createdUserSession) {
    elements.createdUserPanel.classList.add("hidden");
    return;
  }

  const { userId, email, username } = state.createdUserSession;
  elements.createdUserHeadline.textContent = `User #${userId} created`;
  elements.createdUserMessage.textContent = `${email} (${username}) was created successfully.`;
  elements.createdUserPanel.classList.remove("hidden");
}

function placeToneForStatus(status) {
  if (status === "Active") return "success";
  if (status === "Inactive") return "warning";
  return "danger";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getFilteredPlaces() {
  const searchTerm = elements.placeSearchInput.value.trim().toLowerCase();
  const selectedType = elements.placeTypeFilter.value;
  const selectedStatus = elements.placeStatusFilter.value;

  return [...state.places]
    .filter((place) => !selectedType || place.type === selectedType)
    .filter((place) => !selectedStatus || place.status === selectedStatus)
    .filter((place) => {
      if (!searchTerm) return true;

      const haystack = [
        place.name,
        place.city,
        place.country,
        place.addressLine1,
        place.description,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(searchTerm);
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

function renderPlaces() {
  const places = getFilteredPlaces();
  elements.placesEmptyState.classList.toggle("hidden", places.length !== 0);

  elements.placesTableBody.innerHTML = places
    .map((place) => {
      const locationLabel = [place.city, place.country].filter(Boolean).join(", ");
      const canEdit = Boolean(state.token);
      const addressLine = [place.addressLine1, place.addressLine2]
        .filter(Boolean)
        .join(", ");
      const coordinates =
        place.latitude === null ||
        place.latitude === undefined ||
        place.longitude === null ||
        place.longitude === undefined
          ? "Not provided"
          : `${place.latitude}, ${place.longitude}`;

      return `
        <article class="place-card">
          <div class="place-card-top">
            <div>
              <h3 class="place-title">${escapeHtml(place.name)}</h3>
              <p class="place-subtitle">${escapeHtml(place.email || "No email")}</p>
            </div>
            <div class="pill-row">
              <span class="pill">${escapeHtml(place.type)}</span>
              <span class="pill" data-tone="${placeToneForStatus(place.status)}">${escapeHtml(place.status)}</span>
            </div>
          </div>

          <p class="place-description">${escapeHtml(place.description || "No description added yet.")}</p>

          <div class="place-grid">
            <div class="place-meta-block">
              <span class="place-label">Location</span>
              <p class="place-meta">${escapeHtml(locationLabel || "Unknown")}</p>
            </div>
            <div class="place-meta-block">
              <span class="place-label">Created</span>
              <p class="place-meta">${escapeHtml(formatDateTime(place.createdAt))}</p>
            </div>
            <div class="place-meta-block">
              <span class="place-label">Address</span>
              <p class="place-meta">${escapeHtml(addressLine || "Not provided")}</p>
            </div>
            <div class="place-meta-block">
              <span class="place-label">Coordinates</span>
              <p class="place-meta">${escapeHtml(coordinates)}</p>
            </div>
          </div>

          <div class="place-actions">
            <button
                class="secondary-button"
                type="button"
                data-action="edit-place"
                data-id="${escapeHtml(place.id)}"
                ${canEdit ? "" : "disabled"}
              >
                Edit
              </button>
              <button
                class="secondary-button danger"
                type="button"
                data-action="delete-place"
                data-id="${escapeHtml(place.id)}"
                ${canEdit ? "" : "disabled"}
              >
                Delete
              </button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderPlaceFormState() {
  if (state.editingPlaceId) {
    elements.placeFormMode.textContent = "Editing an existing place";
    elements.placeFormHint.textContent =
      "Submitting now will update the selected place record.";
    return;
  }

  elements.placeFormMode.textContent = "Creating a new place";
  elements.placeFormHint.textContent =
    "Sign in first, then submit the form to publish a new place.";
}

function renderAll() {
  renderConnection();
  renderSession();
  renderCreatedUserPanel();
  renderStats();
  renderPlaces();
  renderPlaceFormState();
}

function showToast(message, tone = "info") {
  window.clearTimeout(state.toastTimer);
  elements.toast.textContent = message;
  elements.toast.dataset.tone = tone;
  elements.toast.classList.remove("hidden");
  state.toastTimer = window.setTimeout(() => {
    elements.toast.classList.add("hidden");
  }, 3600);
}

function withBusyState(button, label) {
  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = label;

  return () => {
    button.disabled = false;
    button.textContent = originalLabel;
  };
}

function clearSession() {
  state.token = "";
  state.userId = null;
  state.me = null;
  persistSession();
}

async function loadProfile({ quiet = false } = {}) {
  if (!state.token) {
    state.me = null;
    return;
  }

  try {
    state.me = await apiRequest("/api/users/me");
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      clearSession();
      if (!quiet) {
        showToast("The saved session is no longer valid. Please sign in again.", "warning");
      }
      return;
    }

    throw error;
  }
}

async function loadPlaces() {
  state.places = await apiRequest("/api/places");
}

async function refreshDashboard({ quiet = false } = {}) {
  try {
    setApiStatus("Refreshing...", "pending");
    await loadPlaces();
    state.apiReachable = true;
    state.lastSyncAt = new Date().toISOString();
    await loadProfile({ quiet: true });
    renderAll();

    if (!quiet) {
      showToast("Dashboard data refreshed.", "success");
    }

    return true;
  } catch (error) {
    state.apiReachable = false;
    renderAll();

    if (!quiet) {
      showToast(error.message || "Failed to reach the API.", "error");
    }

    return false;
  }
}

async function applySession(session) {
  state.token = session.accessToken || "";
  state.userId = Number(session.userId) || null;
  persistSession();
  await loadProfile({ quiet: true });
  renderAll();
}

function resetPlaceForm() {
  elements.placeForm.reset();
  getField(elements.placeForm, "type").value = "Vet";
  getField(elements.placeForm, "status").value = "Active";
  state.editingPlaceId = null;
  renderPlaceFormState();
}

function populatePlaceForm(place) {
  state.editingPlaceId = place.id;
  getField(elements.placeForm, "name").value = place.name || "";
  getField(elements.placeForm, "type").value = place.type || "Vet";
  getField(elements.placeForm, "status").value = place.status || "Active";
  getField(elements.placeForm, "phone").value = place.phone || "";
  getField(elements.placeForm, "email").value = place.email || "";
  getField(elements.placeForm, "photo").value = place.photo || "";
  getField(elements.placeForm, "description").value = place.description || "";
  getField(elements.placeForm, "addressLine1").value = place.addressLine1 || "";
  getField(elements.placeForm, "addressLine2").value = place.addressLine2 || "";
  getField(elements.placeForm, "city").value = place.city || "";
  getField(elements.placeForm, "country").value = place.country || "";
  getField(elements.placeForm, "latitude").value =
    place.latitude === null || place.latitude === undefined ? "" : String(place.latitude);
  getField(elements.placeForm, "longitude").value =
    place.longitude === null || place.longitude === undefined ? "" : String(place.longitude);
  renderPlaceFormState();
  elements.placeForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function parseOptionalNumber(value) {
  if (!value.trim()) return null;
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error("Latitude and longitude must be valid numbers.");
  }

  return parsed;
}

async function handleSettingsSubmit(event) {
  event.preventDefault();
  const submitButton = elements.settingsForm.querySelector('button[type="submit"]');
  const restore = withBusyState(submitButton, "Refreshing...");

  if (!IS_SERVED_BY_BACKEND) {
    state.apiBaseUrl = normalizeApiBaseUrl(elements.apiBaseUrlInput.value);
    persistApiBaseUrl();
  }

  try {
    const refreshed = await refreshDashboard({ quiet: true });

    if (refreshed) {
      showToast(
        IS_SERVED_BY_BACKEND
          ? `Connected through backend origin: ${state.apiBaseUrl}`
          : `Saved API base URL: ${state.apiBaseUrl}`,
        "success",
      );
    } else {
      showToast(
        IS_SERVED_BY_BACKEND
          ? "The admin site is using the backend origin, but the API could not be reached."
          : "Saved API base URL, but the API could not be reached.",
        "warning",
      );
    }
  } finally {
    restore();
  }
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const submitButton = elements.loginForm.querySelector('button[type="submit"]');
  const restore = withBusyState(submitButton, "Signing in...");

  const formData = new FormData(elements.loginForm);

  try {
    const session = await apiRequest("/api/auth/login", {
      method: "POST",
      body: {
        email: String(formData.get("email") || "").trim(),
        password: String(formData.get("password") || ""),
      },
    });

    await applySession(session);
    elements.loginForm.reset();
    showToast("Signed in successfully.", "success");
  } catch (error) {
    showToast(error.message || "Unable to sign in.", "error");
  } finally {
    restore();
  }
}

async function handleLogout() {
  if (!state.token) return;

  try {
    await apiRequest("/api/auth/logout", { method: "POST" });
  } catch {
    // The local session should still be cleared even if the API call fails.
  }

  clearSession();
  renderAll();
  showToast("Signed out locally.", "success");
}

async function handleRegisterSubmit(event) {
  event.preventDefault();
  const submitButton = elements.registerForm.querySelector('button[type="submit"]');
  const restore = withBusyState(submitButton, "Creating...");
  const formData = new FormData(elements.registerForm);

  const payload = {
    username: String(formData.get("username") || "").trim(),
    name: String(formData.get("name") || "").trim() || null,
    email: String(formData.get("email") || "").trim(),
    phoneNumber: String(formData.get("phoneNumber") || "").trim(),
    firstName: String(formData.get("firstName") || "").trim(),
    lastName: String(formData.get("lastName") || "").trim(),
    password: String(formData.get("password") || ""),
  };

  try {
    const session = await apiRequest("/api/auth/register", {
      method: "POST",
      body: payload,
    });

    state.createdUserSession = {
      accessToken: session.accessToken,
      userId: session.userId,
      email: payload.email,
      username: payload.username,
    };

    elements.registerForm.reset();

    if (!state.token) {
      await applySession(session);
      showToast(`Created account for ${payload.email} and signed in.`, "success");
    } else {
      renderCreatedUserPanel();
      showToast(`Created user #${session.userId}. Your current session stayed active.`, "success");
    }
  } catch (error) {
    showToast(error.message || "Unable to create the account.", "error");
  } finally {
    restore();
  }
}

async function handlePlaceSubmit(event) {
  event.preventDefault();

  if (!state.token) {
    showToast("Sign in before creating or updating places.", "warning");
    return;
  }

  const submitButton = elements.placeForm.querySelector('button[type="submit"]');
  const restore = withBusyState(
    submitButton,
    state.editingPlaceId ? "Updating..." : "Saving...",
  );

  const formData = new FormData(elements.placeForm);

  try {
    const payload = {
      name: String(formData.get("name") || "").trim(),
      type: String(formData.get("type") || "Vet"),
      status: String(formData.get("status") || "Active"),
      phone: String(formData.get("phone") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      photo: String(formData.get("photo") || "").trim() || null,
      description: String(formData.get("description") || "").trim() || null,
      addressLine1: String(formData.get("addressLine1") || "").trim(),
      addressLine2: String(formData.get("addressLine2") || "").trim() || null,
      city: String(formData.get("city") || "").trim(),
      country: String(formData.get("country") || "").trim(),
      latitude: parseOptionalNumber(String(formData.get("latitude") || "")),
      longitude: parseOptionalNumber(String(formData.get("longitude") || "")),
    };

    if (state.editingPlaceId) {
      await apiRequest(`/api/places/${state.editingPlaceId}`, {
        method: "PUT",
        body: payload,
      });
      showToast("Place updated successfully.", "success");
    } else {
      await apiRequest("/api/places", {
        method: "POST",
        body: payload,
      });
      showToast("Place created successfully.", "success");
    }

    resetPlaceForm();
    await refreshDashboard({ quiet: true });
  } catch (error) {
    showToast(error.message || "Unable to save the place.", "error");
  } finally {
    restore();
  }
}

async function handlePlaceTableClick(event) {
  const actionButton = event.target.closest("button[data-action]");
  if (!actionButton) return;

  const placeId = actionButton.dataset.id;
  const action = actionButton.dataset.action;
  const selectedPlace = state.places.find((place) => place.id === placeId);

  if (!selectedPlace) return;

  if (action === "edit-place") {
    if (!state.token) {
      showToast("Sign in before editing places.", "warning");
      return;
    }

    populatePlaceForm(selectedPlace);
    return;
  }

  if (action === "delete-place") {
    if (!state.token) {
      showToast("Sign in before deleting places.", "warning");
      return;
    }

    const confirmed = window.confirm(
      `Delete "${selectedPlace.name}" from the place directory?`,
    );

    if (!confirmed) return;

    try {
      await apiRequest(`/api/places/${selectedPlace.id}`, { method: "DELETE" });
      if (state.editingPlaceId === selectedPlace.id) {
        resetPlaceForm();
      }
      await refreshDashboard({ quiet: true });
      showToast("Place deleted successfully.", "success");
    } catch (error) {
      showToast(error.message || "Unable to delete the place.", "error");
    }
  }
}

function bindEvents() {
  elements.settingsForm.addEventListener("submit", handleSettingsSubmit);
  elements.loginForm.addEventListener("submit", handleLoginSubmit);
  elements.registerForm.addEventListener("submit", handleRegisterSubmit);
  elements.placeForm.addEventListener("submit", handlePlaceSubmit);
  elements.refreshAllButton.addEventListener("click", () => refreshDashboard());
  elements.refreshPlacesButton.addEventListener("click", () => refreshDashboard());
  elements.resetPlaceFormButton.addEventListener("click", resetPlaceForm);
  elements.sidebarLogoutButton.addEventListener("click", handleLogout);
  elements.mainLogoutButton.addEventListener("click", handleLogout);
  elements.useCreatedSessionButton.addEventListener("click", async () => {
    if (!state.createdUserSession) return;

    await applySession(state.createdUserSession);
    showToast("Switched to the newly created account.", "success");
  });

  elements.placeSearchInput.addEventListener("input", renderPlaces);
  elements.placeTypeFilter.addEventListener("change", renderPlaces);
  elements.placeStatusFilter.addEventListener("change", renderPlaces);
  elements.placesTableBody.addEventListener("click", handlePlaceTableClick);
}

async function init() {
  elements.apiBaseUrlInput.value = state.apiBaseUrl;
  if (IS_SERVED_BY_BACKEND) {
    elements.apiBaseUrlInput.readOnly = true;
    elements.apiBaseUrlInput.title =
      "This admin app is being served by the backend, so the API origin is fixed automatically.";
  }
  resetPlaceForm();
  bindEvents();
  renderAll();
  await refreshDashboard({ quiet: true });
}

init();
}
