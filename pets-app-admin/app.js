const HAS_BROWSER_RUNTIME =
  typeof window !== "undefined" &&
  typeof document !== "undefined" &&
  typeof localStorage !== "undefined";

if (!HAS_BROWSER_RUNTIME) {
  const runtimeMessage =
    'pets-app-admin/app.js is a browser-only script. Start the backend with "dotnet run --project PetCare.Api/PetCare.Api/PetCare.Api.csproj" and open "http://localhost:5063/admin" in your browser, or serve "pets-app-admin" with a local static server for standalone UI testing.';

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
const IS_ADMIN_LOGIN_ROUTE =
  IS_SERVED_BY_BACKEND && /^\/admin\/login\/?$/.test(window.location.pathname);
const DEFAULT_API_BASE_URL = IS_SERVED_BY_BACKEND
  ? window.location.origin
  : DEFAULT_FALLBACK_API_BASE_URL;
const STORAGE_KEYS = {
  apiBaseUrl: "pets-admin.api-base-url",
  token: "pets-admin.access-token",
  userId: "pets-admin.user-id",
};

if (IS_SERVED_BY_BACKEND) {
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.userId);
}

const state = {
  apiBaseUrl: IS_SERVED_BY_BACKEND
    ? normalizeApiBaseUrl(DEFAULT_API_BASE_URL)
    : normalizeApiBaseUrl(
        localStorage.getItem(STORAGE_KEYS.apiBaseUrl) || DEFAULT_API_BASE_URL,
      ),
  token: IS_SERVED_BY_BACKEND ? "" : localStorage.getItem(STORAGE_KEYS.token) || "",
  userId: IS_SERVED_BY_BACKEND
    ? null
    : parseStoredNumber(localStorage.getItem(STORAGE_KEYS.userId)),
  me: null,
  places: [],
  placeOwnerApplications: [],
  reports: [],
  aiModerationPosts: [],
  aiModerationLoadError: "",
  reportTargetDetails: {},
  editingPlaceId: null,
  editingPlaceSchedule: [],
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
  applicationStatusFilter: document.querySelector("#applicationStatusFilter"),
  applicationTypeFilter: document.querySelector("#applicationTypeFilter"),
  refreshApplicationsButton: document.querySelector("#refreshApplicationsButton"),
  applicationsList: document.querySelector("#applicationsList"),
  applicationsEmptyState: document.querySelector("#applicationsEmptyState"),
  reportStatusFilter: document.querySelector("#reportStatusFilter"),
  reportTargetTypeFilter: document.querySelector("#reportTargetTypeFilter"),
  reportPriorityFilter: document.querySelector("#reportPriorityFilter"),
  reportSortFilter: document.querySelector("#reportSortFilter"),
  refreshReportsButton: document.querySelector("#refreshReportsButton"),
  reportsList: document.querySelector("#reportsList"),
  reportsEmptyState: document.querySelector("#reportsEmptyState"),
  aiModerationStatus: document.querySelector("#aiModerationStatus"),
  aiModerationList: document.querySelector("#aiModerationList"),
  aiModerationEmptyState: document.querySelector("#aiModerationEmptyState"),
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
  quickLinks: document.querySelector(".quick-links"),
  statsRow: document.querySelector(".stats-row"),
  connectionSection: document.querySelector("#connection"),
  sessionCard: document.querySelector("#profileCard")?.closest(".screen-card"),
  userSetupSection: document.querySelector("#users"),
  requestsSection: document.querySelector("#requests"),
  reportsSection: document.querySelector("#reports"),
  placesSection: document.querySelector("#places"),
  directorySection: document.querySelector("#placesTableBody")?.closest(".screen-card"),
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
  if (IS_SERVED_BY_BACKEND) {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.userId);
    return;
  }

  if (state.token && state.userId !== null) {
    localStorage.setItem(STORAGE_KEYS.token, state.token);
    localStorage.setItem(STORAGE_KEYS.userId, String(state.userId));
    return;
  }

  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.userId);
}

function hasAdminSession() {
  return Boolean(state.me);
}

function redirectToAdminLogin() {
  if (!IS_SERVED_BY_BACKEND) {
    return;
  }

  window.location.replace("/admin/login");
}

function redirectToAdminDashboard() {
  if (!IS_SERVED_BY_BACKEND) {
    return;
  }

  window.location.replace("/admin/home");
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

  if (!IS_SERVED_BY_BACKEND && state.token) {
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

function buildDefaultWeeklySchedule() {
  const weekdays = {
    Monday: true,
    Tuesday: true,
    Wednesday: true,
    Thursday: true,
    Friday: true,
  };

  return [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ].map((dayOfWeek) => {
    const isOpenWeekday = Boolean(weekdays[dayOfWeek]);

    return {
      dayOfWeek,
      isClosed: !isOpenWeekday,
      openTime: isOpenWeekday ? "09:00" : null,
      closeTime: isOpenWeekday ? "17:00" : null,
      breakStartTime: null,
      breakEndTime: null,
    };
  });
}

function normalizeScheduleEntry(entry) {
  return {
    dayOfWeek: String(entry?.dayOfWeek || "Monday"),
    isClosed: Boolean(entry?.isClosed),
    openTime: entry?.openTime || null,
    closeTime: entry?.closeTime || null,
    breakStartTime: entry?.breakStartTime || null,
    breakEndTime: entry?.breakEndTime || null,
  };
}

function applicationToneForStatus(status) {
  if (status === "Approved") return "success";
  if (status === "Rejected") return "danger";
  return "warning";
}

function reportToneForStatus(status) {
  if (status === "Reviewed" || status === "ActionTaken") return "success";
  if (status === "Dismissed") return "danger";
  return "warning";
}

function reportToneForPriority(priority) {
  if (priority === "High") return "danger";
  if (priority === "Medium") return "warning";
  return "success";
}

function reportToneForModerationStatus(status) {
  if (status === "Reviewed") return "success";
  if (status === "AutoHidden") return "danger";
  return "warning";
}

function reportToneForModerationLabel(label) {
  if (label === "Spam" || label === "Abusive") return "danger";
  if (label === "Suspicious") return "warning";
  return "success";
}

function isAdminAuthError(error) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

function logAdminSectionError(section, error) {
  console.error(`[admin] Failed to load ${section}.`, error);
}

function formatReportTargetType(targetType) {
  return targetType === "ForumPost" ? "Forum post" : "User";
}

function truncateText(value, maxLength = 220) {
  const normalized = String(value || "").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}...`;
}

function getReportTargetCacheKey(targetType, targetId) {
  return `${targetType}:${targetId}`;
}

function getReportActionLabel(report, targetDetails) {
  if (report.targetType === "User") {
    if (targetDetails && targetDetails.state !== "ready") {
      return "Mark action taken";
    }

    if (targetDetails?.state === "ready" && targetDetails.data?.isBanned) {
      return "Mark action taken";
    }

    return "Ban user + resolve";
  }

  if (targetDetails?.state === "ready") {
    return "Delete post + resolve";
  }

  return "Mark action taken";
}

function renderReportTargetSummary(report) {
  const targetDetails =
    state.reportTargetDetails[getReportTargetCacheKey(report.targetType, report.targetId)];
  const targetLabel = formatReportTargetType(report.targetType);

  if (!targetDetails || targetDetails.state === "loading") {
    return `
      <div class="report-target-panel">
        <span class="place-label">Reported target</span>
        <strong class="report-target-title">${escapeHtml(targetLabel)} ${escapeHtml(report.targetId)}</strong>
        <p class="place-meta">Loading target details...</p>
      </div>
    `;
  }

  if (targetDetails.state === "missing") {
    return `
      <div class="report-target-panel">
        <span class="place-label">Reported target</span>
        <strong class="report-target-title">${escapeHtml(targetLabel)} ${escapeHtml(report.targetId)}</strong>
        <p class="place-meta">This target is no longer available. You can still review or resolve the report.</p>
      </div>
    `;
  }

  if (targetDetails.state === "error") {
    return `
      <div class="report-target-panel">
        <span class="place-label">Reported target</span>
        <strong class="report-target-title">${escapeHtml(targetLabel)} ${escapeHtml(report.targetId)}</strong>
        <p class="place-meta">${escapeHtml(targetDetails.message || "Unable to load target details right now.")}</p>
      </div>
    `;
  }

  if (report.targetType === "User") {
    const user = targetDetails.data;
    const displayName =
      `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      user.username ||
      `User #${user.id}`;
    const body = user.isBanned
      ? `Account is currently banned${user.banReason ? `: ${user.banReason}` : "."}`
      : user.description || "No profile description was added.";

    return `
      <div class="report-target-panel">
        <span class="place-label">Reported target</span>
        <strong class="report-target-title">${escapeHtml(displayName)} · @${escapeHtml(user.username || "user")}</strong>
        <p class="place-meta">${escapeHtml(user.email || "No email")} · ${escapeHtml(user.isBanned ? "Banned" : "Active")}</p>
        <p class="report-target-body">${escapeHtml(body)}</p>
      </div>
    `;
  }

  const post = targetDetails.data;
  const replyLabel = post.isAReply ? "Reply" : "Post";

  return `
    <div class="report-target-panel">
      <span class="place-label">Reported target</span>
      <strong class="report-target-title">${escapeHtml(replyLabel)} by ${escapeHtml(post.userName || "Unknown user")}</strong>
      <p class="place-meta">${escapeHtml(formatDateTime(post.createdAt))} · ${escapeHtml(String(post.likesCount || 0))} likes · ${escapeHtml(String(post.repliesCount || 0))} replies</p>
      <p class="report-target-body">${escapeHtml(truncateText(post.content || "No content."))}</p>
    </div>
  `;
}

function renderStats() {
  const stats = {
    totalPlaces: state.places.length,
    activePlaces: state.places.filter((place) => place.status === "Active").length,
    vetPlaces: state.places.filter((place) => place.type === "Vet").length,
    petShops: state.places.filter((place) => place.type === "PetShop").length,
    pendingApplications: state.placeOwnerApplications.filter(
      (application) => application.status === "Pending",
    ).length,
    approvedApplications: state.placeOwnerApplications.filter(
      (application) => application.status === "Approved",
    ).length,
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

  elements.tokenStatus.textContent = state.me
    ? `Admin session active for #${state.me.id}`
    : IS_SERVED_BY_BACKEND
      ? "Checking secure admin session"
    : state.token
      ? `Admin token stored for #${state.userId ?? "?"}`
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
  const isSignedIn = Boolean(state.me);
  const canLogout = isSignedIn || Boolean(state.token);

  [elements.sidebarLogoutButton, elements.mainLogoutButton].forEach((button) => {
    if (button) {
      button.disabled = !canLogout;
    }
  });

  if (!isSignedIn) {
    elements.profileHeadline.textContent = IS_SERVED_BY_BACKEND
      ? "Checking access"
      : "Guest mode";
    elements.profileSummary.textContent =
      IS_SERVED_BY_BACKEND
        ? "This dashboard uses the dedicated admin login page. If your session is not valid, you will be sent there automatically."
        : state.token
        ? "A token is stored, but the profile could not be loaded. Please sign in again if this continues."
        : "Sign in as an admin to review place-owner requests and manage places. Public endpoints will still load the directory list.";
    elements.profileUserId.textContent = state.userId
      ? String(state.userId)
      : IS_SERVED_BY_BACKEND
        ? "Checking"
        : "Not signed in";
    elements.profileEmail.textContent = IS_SERVED_BY_BACKEND ? "Checking" : "Not signed in";
    elements.profileLastLogin.textContent = "Unknown";
    return;
  }

  const displayName =
    `${state.me.firstName || ""} ${state.me.lastName || ""}`.trim() ||
    state.me.username ||
    `Admin #${state.me.id}`;

  elements.profileHeadline.textContent = displayName;
  elements.profileSummary.textContent = `Signed in as ${state.me.username} (${state.me.role}). Admin request review and place management are ready.`;
  elements.profileUserId.textContent = String(state.me.id);
  elements.profileEmail.textContent = state.me.email || "No email";
  elements.profileLastLogin.textContent = formatDateTime(state.me.lastLogin);
}

function renderAccessGate() {
  const showDashboard = hasAdminSession() && !IS_ADMIN_LOGIN_ROUTE;

  [
    elements.quickLinks,
    elements.statsRow,
    elements.sessionCard,
    elements.userSetupSection,
    elements.requestsSection,
    elements.reportsSection,
    elements.placesSection,
    elements.directorySection,
  ].forEach((element) => {
    element?.classList.toggle("hidden", !showDashboard);
  });

  if (elements.connectionSection) {
    elements.connectionSection.classList.toggle("hidden", false);
  }
}

function renderCreatedUserPanel() {
  if (!state.createdUserSession) {
    elements.createdUserPanel.classList.add("hidden");
    elements.useCreatedSessionButton.classList.add("hidden");
    return;
  }

  const { userId, email, username, message } = state.createdUserSession;
  elements.createdUserHeadline.textContent = `User #${userId} created`;
  elements.createdUserMessage.textContent =
    message || `${email} (${username}) was created successfully.`;
  elements.useCreatedSessionButton.classList.add("hidden");
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
      const canEdit = hasAdminSession();
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

function getFilteredPlaceOwnerApplications() {
  const selectedStatus = elements.applicationStatusFilter?.value || "";
  const selectedType = elements.applicationTypeFilter?.value || "";

  return [...state.placeOwnerApplications]
    .filter(
      (application) =>
        !selectedStatus || application.status === selectedStatus,
    )
    .filter(
      (application) =>
        !selectedType || application.requestedPlaceType === selectedType,
    )
    .sort((left, right) => {
      const leftTime = new Date(left.createdAt).getTime();
      const rightTime = new Date(right.createdAt).getTime();
      return rightTime - leftTime;
    });
}

function renderPlaceOwnerApplications() {
  if (!elements.applicationsList || !elements.applicationsEmptyState) {
    return;
  }

  const applications = getFilteredPlaceOwnerApplications();
  const emptyMessage = hasAdminSession()
    ? "No place-owner requests match the current filters."
    : "Sign in as an admin to review place-owner requests.";

  elements.applicationStatusFilter.disabled = !hasAdminSession();
  elements.applicationTypeFilter.disabled = !hasAdminSession();
  elements.refreshApplicationsButton.disabled = !hasAdminSession();
  elements.applicationsEmptyState.textContent = emptyMessage;
  elements.applicationsEmptyState.classList.toggle(
    "hidden",
    applications.length !== 0,
  );

  elements.applicationsList.innerHTML = applications
    .map((application) => {
      const applicantLabel =
        application.displayName || application.username || `User #${application.userId}`;
      const notes = application.adminNotes || application.rejectionReason || "";
      const isPending = application.status === "Pending";

      return `
        <article class="request-card">
          <div class="place-card-top">
            <div>
              <h3 class="place-title">${escapeHtml(application.businessName)}</h3>
              <p class="place-subtitle">
                ${escapeHtml(applicantLabel)} · @${escapeHtml(application.username || "user")}
              </p>
            </div>
            <div class="pill-row">
              <span class="pill">${escapeHtml(application.requestedPlaceType)}</span>
              <span class="pill" data-tone="${applicationToneForStatus(application.status)}">
                ${escapeHtml(application.status)}
              </span>
            </div>
          </div>

          <div class="place-grid">
            <div class="place-meta-block">
              <span class="place-label">Contact</span>
              <p class="place-meta">${escapeHtml(application.email || "No email")}</p>
              <p class="place-meta">${escapeHtml(application.phone || "No phone")}</p>
            </div>
            <div class="place-meta-block">
              <span class="place-label">Location</span>
              <p class="place-meta">${escapeHtml(
                [application.city, application.country].filter(Boolean).join(", ") || "Unknown",
              )}</p>
            </div>
            <div class="place-meta-block">
              <span class="place-label">Submitted</span>
              <p class="place-meta">${escapeHtml(formatDateTime(application.createdAt))}</p>
            </div>
            <div class="place-meta-block">
              <span class="place-label">Reviewed</span>
              <p class="place-meta">${escapeHtml(formatDateTime(application.reviewedAt))}</p>
            </div>
          </div>

          ${
            notes
              ? `<p class="request-notes">${escapeHtml(notes)}</p>`
              : ""
          }

          <div class="place-actions">
            ${
              isPending
                ? `
                  <button
                    class="primary-button"
                    type="button"
                    data-action="approve-application"
                    data-id="${escapeHtml(application.id)}"
                  >
                    Approve
                  </button>
                  <button
                    class="secondary-button danger"
                    type="button"
                    data-action="reject-application"
                    data-id="${escapeHtml(application.id)}"
                  >
                    Reject
                  </button>
                `
                : `
                  <button
                    class="secondary-button"
                    type="button"
                    disabled
                  >
                    Review Complete
                  </button>
                `
            }
          </div>
        </article>
      `;
    })
    .join("");
}

function renderReports() {
  if (!elements.reportsList || !elements.reportsEmptyState) {
    return;
  }

  const canReviewReports = hasAdminSession();
  [
    elements.reportStatusFilter,
    elements.reportTargetTypeFilter,
    elements.reportPriorityFilter,
    elements.reportSortFilter,
    elements.refreshReportsButton,
  ].forEach((element) => {
    if (element) {
      element.disabled = !canReviewReports;
    }
  });

  if (!canReviewReports) {
    elements.reportsList.innerHTML = "";
    elements.reportsEmptyState.textContent =
      "Sign in as an admin to review reported users and forum posts.";
    elements.reportsEmptyState.classList.remove("hidden");
    return;
  }

  elements.reportsEmptyState.textContent = "No reports match the current filters.";
  elements.reportsEmptyState.classList.toggle("hidden", state.reports.length !== 0);

  elements.reportsList.innerHTML = state.reports
    .map((report) => {
      const reviewerLabel = report.reviewedByAdminUsername
        ? `${report.reviewedByAdminUsername} · ${formatDateTime(report.reviewedAt)}`
        : "Not reviewed yet";
      const reporterLabel =
        report.reporterDisplayName ||
        report.reporterUsername ||
        `User #${report.reporterUserId}`;
      const targetDetails =
        state.reportTargetDetails[getReportTargetCacheKey(report.targetType, report.targetId)] ||
        null;
      const isPending = report.status === "Pending";
      const actionLabel = getReportActionLabel(report, targetDetails);
      const canTakeAction = isPending && targetDetails?.state !== "loading";

      return `
        <article class="request-card report-card">
          <div class="place-card-top">
            <div>
              <h3 class="place-title">${escapeHtml(formatReportTargetType(report.targetType))} report #${escapeHtml(report.id)}</h3>
              <p class="place-subtitle">
                Reported by ${escapeHtml(reporterLabel)} · @${escapeHtml(report.reporterUsername || "user")}
              </p>
            </div>
            <div class="pill-row">
              <span class="pill" data-tone="${reportToneForPriority(report.priority)}">${escapeHtml(report.priority)}</span>
              <span class="pill">${escapeHtml(formatReportTargetType(report.targetType))}</span>
              <span class="pill" data-tone="${reportToneForStatus(report.status)}">${escapeHtml(report.status)}</span>
            </div>
          </div>

          <div class="place-grid">
            <div class="place-meta-block">
              <span class="place-label">Reason</span>
              <p class="place-meta">${escapeHtml(report.reasonType)}</p>
            </div>
            <div class="place-meta-block">
              <span class="place-label">Pending on target</span>
              <p class="place-meta">${escapeHtml(String(report.pendingReportsForTarget))} total</p>
              <p class="place-meta">${escapeHtml(String(report.distinctPendingReportersForTarget))} distinct reporters</p>
            </div>
            <div class="place-meta-block">
              <span class="place-label">Reported at</span>
              <p class="place-meta">${escapeHtml(formatDateTime(report.createdAt))}</p>
            </div>
            <div class="place-meta-block">
              <span class="place-label">Review status</span>
              <p class="place-meta">${escapeHtml(reviewerLabel)}</p>
            </div>
          </div>

          ${renderReportTargetSummary(report)}

          ${
            report.description
              ? `<p class="request-notes">Reporter note: ${escapeHtml(report.description)}</p>`
              : ""
          }

          <div class="place-actions">
            ${
              isPending
                ? `
                  <button
                    class="secondary-button"
                    type="button"
                    data-action="review-report"
                    data-id="${escapeHtml(report.id)}"
                  >
                    Mark reviewed
                  </button>
                  <button
                    class="primary-button"
                    type="button"
                    data-action="take-report-action"
                    data-id="${escapeHtml(report.id)}"
                    ${canTakeAction ? "" : "disabled"}
                  >
                    ${escapeHtml(actionLabel)}
                  </button>
                  <button
                    class="secondary-button danger"
                    type="button"
                    data-action="dismiss-report"
                    data-id="${escapeHtml(report.id)}"
                  >
                    Dismiss
                  </button>
                `
                : `
                  <button
                    class="secondary-button"
                    type="button"
                    disabled
                  >
                    Review Complete
                  </button>
                `
            }
          </div>
        </article>
      `;
    })
    .join("");
}

function renderAiModerationQueue() {
  if (!elements.aiModerationList || !elements.aiModerationEmptyState) {
    return;
  }

  const canReviewQueue = hasAdminSession();
  if (!canReviewQueue) {
    elements.aiModerationList.innerHTML = "";
    if (elements.aiModerationStatus) {
      elements.aiModerationStatus.textContent =
        "Sign in as an admin to load the AI moderation queue.";
    }
    elements.aiModerationEmptyState.textContent =
      "Sign in as an admin to review forum posts flagged by the AI moderator.";
    elements.aiModerationEmptyState.classList.remove("hidden");
    return;
  }

  if (elements.aiModerationStatus) {
    if (state.aiModerationLoadError) {
      elements.aiModerationStatus.textContent =
        `Unable to load the AI moderation queue: ${state.aiModerationLoadError}`;
    } else if (state.aiModerationPosts.length === 0) {
      elements.aiModerationStatus.textContent =
        "Loaded 0 AI-flagged forum posts that still need review.";
    } else {
      elements.aiModerationStatus.textContent =
        `Loaded ${state.aiModerationPosts.length} AI-flagged forum post${
          state.aiModerationPosts.length === 1 ? "" : "s"
        } waiting for review.`;
    }
  }

  elements.aiModerationEmptyState.textContent =
    state.aiModerationLoadError
      ? "The AI moderation queue could not be loaded. Check the browser console for details."
      : "No AI-flagged forum posts are waiting for review.";
  elements.aiModerationEmptyState.classList.toggle(
    "hidden",
    state.aiModerationPosts.length !== 0,
  );

  elements.aiModerationList.innerHTML = state.aiModerationPosts
    .map((post) => {
      const moderation = post.moderation || {};
      const aiLabel = moderation.aiLabel || "Unknown";
      const status = moderation.status || "Flagged";
      const reviewStateLabel = moderation.reviewedByAdminUsername
        ? `${moderation.reviewedByAdminUsername} · ${formatDateTime(moderation.reviewedAt)}`
        : "Awaiting admin review";
      const createdLabel = formatDateTime(post.createdAt);
      const moderatedLabel = formatDateTime(moderation.moderatedAt || post.createdAt);
      const confidenceLabel =
        moderation.aiConfidence === null || moderation.aiConfidence === undefined
          ? "Unknown"
          : `${Math.round(Number(moderation.aiConfidence) * 100)}%`;
      const attachmentsCount = Array.isArray(post.attachments) ? post.attachments.length : 0;
      const replyLabel = post.isAReply ? "Reply" : "Forum post";

      return `
        <article class="request-card report-card">
          <div class="place-card-top">
            <div>
              <h3 class="place-title">${escapeHtml(replyLabel)} flagged by AI</h3>
              <p class="place-subtitle">
                ${escapeHtml(post.userName || "Unknown user")} · ${escapeHtml(createdLabel)}
              </p>
            </div>
            <div class="pill-row">
              <span class="pill">AI moderation</span>
              <span class="pill" data-tone="${reportToneForModerationLabel(aiLabel)}">${escapeHtml(aiLabel)}</span>
              <span class="pill" data-tone="${reportToneForModerationStatus(status)}">${escapeHtml(status)}</span>
            </div>
          </div>

          <div class="place-grid">
            <div class="place-meta-block">
              <span class="place-label">Confidence</span>
              <p class="place-meta">${escapeHtml(confidenceLabel)}</p>
            </div>
            <div class="place-meta-block">
              <span class="place-label">Moderated at</span>
              <p class="place-meta">${escapeHtml(moderatedLabel)}</p>
            </div>
            <div class="place-meta-block">
              <span class="place-label">Activity</span>
              <p class="place-meta">${escapeHtml(String(post.likesCount || 0))} likes · ${escapeHtml(String(post.repliesCount || 0))} replies</p>
            </div>
            <div class="place-meta-block">
              <span class="place-label">Attachments</span>
              <p class="place-meta">${escapeHtml(String(attachmentsCount))}</p>
            </div>
          </div>

          <div class="report-target-panel">
            <span class="place-label">Flagged content</span>
            <strong class="report-target-title">${escapeHtml(replyLabel)} by ${escapeHtml(post.userName || "Unknown user")}</strong>
            <p class="report-target-body">${escapeHtml(truncateText(post.content || "No content."))}</p>
          </div>

          ${
            moderation.aiReason
              ? `<p class="request-notes">AI reason: ${escapeHtml(moderation.aiReason)}</p>`
              : ""
          }

          <p class="place-meta">Review state: ${escapeHtml(reviewStateLabel)}</p>

          <div class="place-actions">
            ${
              status === "AutoHidden"
                ? `
                  <button
                    class="primary-button"
                    type="button"
                    data-action="confirm-ai-post-hidden"
                    data-id="${escapeHtml(post.id)}"
                  >
                    Confirm hidden
                  </button>
                  <button
                    class="secondary-button"
                    type="button"
                    data-action="publish-ai-post"
                    data-id="${escapeHtml(post.id)}"
                  >
                    Make public
                  </button>
                `
                : `
                  <button
                    class="primary-button"
                    type="button"
                    data-action="auto-hide-ai-post"
                    data-id="${escapeHtml(post.id)}"
                  >
                    Hide post
                  </button>
                  <button
                    class="secondary-button"
                    type="button"
                    data-action="review-ai-post"
                    data-id="${escapeHtml(post.id)}"
                  >
                    Mark reviewed
                  </button>
                `
            }
            <button
              class="secondary-button danger"
              type="button"
              data-action="delete-ai-post"
              data-id="${escapeHtml(post.id)}"
            >
              Delete post
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
      "Submitting now will update the selected place record and keep its current weekly schedule.";
    return;
  }

  elements.placeFormMode.textContent = "Creating a new place";
  elements.placeFormHint.textContent =
    hasAdminSession()
      ? "Submitting now will publish a new place with a default weekday schedule."
      : "Sign in first, then submit the form to publish a new place. New places start with a default weekday schedule.";
}

function renderAll() {
  renderAccessGate();
  renderConnection();
  renderSession();
  renderCreatedUserPanel();
  renderStats();
  renderPlaces();
  renderPlaceOwnerApplications();
  renderReports();
  renderAiModerationQueue();
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
  state.places = [];
  state.placeOwnerApplications = [];
  state.reports = [];
  state.aiModerationPosts = [];
  state.aiModerationLoadError = "";
  state.reportTargetDetails = {};
  state.createdUserSession = null;
  state.lastSyncAt = null;
  state.apiReachable = null;
  persistSession();
}

async function loadProfile({ quiet = false } = {}) {
  if (!state.token && !IS_SERVED_BY_BACKEND) {
    state.me = null;
    return;
  }

  try {
    state.me = await apiRequest("/api/admin/profile/me");
    state.userId = Number(state.me?.id) || state.userId;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      clearSession();
      if (!quiet) {
        showToast("The saved session is no longer valid. Please sign in again.", "warning");
      }
      if (!IS_ADMIN_LOGIN_ROUTE) {
        redirectToAdminLogin();
      }
      return;
    }

    throw error;
  }
}

async function loadPlaces() {
  state.places = await apiRequest("/api/places");
}

async function loadPlaceOwnerApplications() {
  if (!hasAdminSession()) {
    state.placeOwnerApplications = [];
    return;
  }

  const response = await apiRequest(
    "/api/admin/place-owner-applications?page=1&pageSize=200",
  );

  state.placeOwnerApplications = Array.isArray(response?.items)
    ? response.items
    : [];
}

async function fetchReportTargetDetails(report) {
  try {
    if (report.targetType === "User") {
      const userId = Number(report.targetId);

      if (!Number.isFinite(userId)) {
        return {
          state: "error",
          message: "The reported user id is invalid.",
        };
      }

      return {
        state: "ready",
        data: await apiRequest(`/api/admin/users/${userId}`),
      };
    }

    return {
      state: "ready",
      data: await apiRequest(`/api/ForumPosts/${report.targetId}`),
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { state: "missing" };
    }

    return {
      state: "error",
      message: error.message || "Unable to load target details.",
    };
  }
}

async function loadReports() {
  if (!hasAdminSession()) {
    state.reports = [];
    state.reportTargetDetails = {};
    return;
  }

  const params = new URLSearchParams({
    page: "1",
    pageSize: "50",
    sort: elements.reportSortFilter?.value || "highestPriority",
  });

  const selectedStatus = elements.reportStatusFilter
    ? elements.reportStatusFilter.value
    : "";
  const selectedTargetType = elements.reportTargetTypeFilter?.value || "";
  const selectedPriority = elements.reportPriorityFilter?.value || "";

  if (selectedStatus) {
    params.set("status", selectedStatus);
  }

  if (selectedTargetType) {
    params.set("targetType", selectedTargetType);
  }

  if (selectedPriority) {
    params.set("priority", selectedPriority);
  }

  const response = await apiRequest(`/api/admin/reports?${params.toString()}`);
  state.reports = Array.isArray(response?.items) ? response.items : [];

  const uniqueTargets = [
    ...new Map(
      state.reports.map((report) => [
        getReportTargetCacheKey(report.targetType, report.targetId),
        report,
      ]),
    ).values(),
  ];

  state.reportTargetDetails = Object.fromEntries(
    uniqueTargets.map((report) => [
      getReportTargetCacheKey(report.targetType, report.targetId),
      { state: "loading" },
    ]),
  );

  renderReports();

  const detailEntries = await Promise.all(
    uniqueTargets.map(async (report) => [
      getReportTargetCacheKey(report.targetType, report.targetId),
      await fetchReportTargetDetails(report),
    ]),
  );

  state.reportTargetDetails = {
    ...state.reportTargetDetails,
    ...Object.fromEntries(detailEntries),
  };
}

async function loadAiModerationQueue() {
  if (!hasAdminSession()) {
    state.aiModerationPosts = [];
    state.aiModerationLoadError = "";
    return;
  }

  const params = new URLSearchParams({
    page: "1",
    pageSize: "200",
    sortBy: "confidence",
    sortDirection: "desc",
    onlyUnsafeAi: "true",
    onlyPendingReview: "true",
  });

  const response = await apiRequest(
    `/api/admin/forum-posts/moderation?${params.toString()}`,
  );

  const items = Array.isArray(response?.items) ? response.items : [];
  state.aiModerationPosts = items.filter((post) => {
    const moderation = post?.moderation || {};
    return (
      moderation.aiLabel &&
      moderation.aiLabel !== "Safe" &&
      !moderation.reviewedAt
    );
  });
  state.aiModerationLoadError = "";
  console.info("[admin] AI moderation queue loaded.", {
    totalReceived: items.length,
    visibleCount: state.aiModerationPosts.length,
    postIds: state.aiModerationPosts.map((post) => post.id),
  });
}

async function refreshDashboard({ quiet = false } = {}) {
  let hasPartialFailures = false;

  try {
    setApiStatus("Refreshing...", "pending");
    await loadProfile({ quiet: true });

    if (hasAdminSession()) {
      const sectionNames = [
        "places",
        "place owner applications",
        "reports",
        "AI moderation queue",
      ];
      const results = await Promise.allSettled([
        loadPlaces(),
        loadPlaceOwnerApplications(),
        loadReports(),
        loadAiModerationQueue(),
      ]);
      hasPartialFailures = results.some((result) => result.status === "rejected");
      const authFailure = results.find(
        (result) => result.status === "rejected" && isAdminAuthError(result.reason),
      );

      if (authFailure) {
        clearSession();
        renderAll();
        redirectToAdminLogin();
        return false;
      }

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          logAdminSectionError(sectionNames[index], result.reason);
          if (sectionNames[index] === "AI moderation queue") {
            state.aiModerationPosts = [];
            state.aiModerationLoadError =
              result.reason?.message || "Unknown error while loading AI moderation queue.";
          }
        }
      });

      state.lastSyncAt = new Date().toISOString();
      state.apiReachable = true;
    } else {
      state.places = [];
      state.placeOwnerApplications = [];
      state.reports = [];
      state.aiModerationPosts = [];
      state.aiModerationLoadError = "";
      state.reportTargetDetails = {};
      state.apiReachable = null;
    }

    renderAll();

    if (!quiet) {
      showToast(
        hasAdminSession()
          ? hasPartialFailures
            ? "Dashboard refreshed, but some admin sections failed. Check the browser console."
            : "Dashboard data refreshed."
          : "Ready for admin sign-in.",
        hasPartialFailures ? "warning" : "success",
      );
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

async function refreshReports({ quiet = false } = {}) {
  if (!hasAdminSession()) {
    state.reports = [];
    state.aiModerationPosts = [];
    state.aiModerationLoadError = "";
    state.reportTargetDetails = {};
    renderReports();
    renderAiModerationQueue();
    return false;
  }

  try {
    const results = await Promise.allSettled([
      loadReports(),
      loadAiModerationQueue(),
    ]);
    const authFailure = results.find(
      (result) => result.status === "rejected" && isAdminAuthError(result.reason),
    );

    if (authFailure) {
      clearSession();
      renderAll();
      redirectToAdminLogin();
      return false;
    }

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        logAdminSectionError(index === 0 ? "reports" : "AI moderation queue", result.reason);
      }
    });

    if (results[1]?.status === "rejected") {
      state.aiModerationPosts = [];
      state.aiModerationLoadError =
        results[1].reason?.message || "Unknown error while loading AI moderation queue.";
    }

    renderReports();
    renderAiModerationQueue();

    if (!quiet) {
      const hasFailures = results.some((result) => result.status === "rejected");
      showToast(
        hasFailures
          ? "Reports refreshed, but part of the moderation data failed to load. Check the browser console."
          : "Reports and AI moderation queue refreshed.",
        hasFailures ? "warning" : "success",
      );
    }

    return results.every((result) => result.status === "fulfilled");
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      clearSession();
      renderAll();
      redirectToAdminLogin();
      return false;
    }

    renderReports();
    renderAiModerationQueue();

    if (!quiet) {
      showToast(error.message || "Unable to refresh reports.", "error");
    }

    return false;
  }
}

async function applySession(session) {
  state.token = IS_SERVED_BY_BACKEND ? "" : session.accessToken || "";
  state.userId = Number(session.adminId ?? session.userId) || null;
  persistSession();
  await loadProfile({ quiet: true });
  renderAll();
}

function resetPlaceForm() {
  elements.placeForm.reset();
  getField(elements.placeForm, "type").value = "Vet";
  getField(elements.placeForm, "status").value = "Active";
  state.editingPlaceId = null;
  state.editingPlaceSchedule = buildDefaultWeeklySchedule();
  renderPlaceFormState();
}

function populatePlaceForm(place) {
  state.editingPlaceId = place.id;
  state.editingPlaceSchedule = Array.isArray(place.schedule) && place.schedule.length
    ? place.schedule.map(normalizeScheduleEntry)
    : buildDefaultWeeklySchedule();
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
    const session = await apiRequest("/api/admin/auth/login", {
      method: "POST",
      body: {
        email: String(formData.get("email") || "").trim(),
        password: String(formData.get("password") || ""),
      },
    });

    await applySession(session);
    elements.loginForm.reset();

    if (IS_SERVED_BY_BACKEND) {
      redirectToAdminDashboard();
      return;
    }

    showToast("Admin session ready.", "success");
  } catch (error) {
    showToast(error.message || "Unable to sign in.", "error");
  } finally {
    restore();
  }
}

async function handleLogout() {
  if (!hasAdminSession() && !state.token) return;

  try {
    await apiRequest("/api/admin/auth/logout", { method: "POST" });
  } catch (error) {
    if (!(error instanceof ApiError && (error.status === 401 || error.status === 403))) {
      showToast(error.message || "Unable to sign out right now.", "error");
      return;
    }
  }

  clearSession();
  renderAll();

  if (IS_SERVED_BY_BACKEND) {
    redirectToAdminLogin();
    return;
  }

  showToast("Signed out successfully.", "success");
}

async function handleRegisterSubmit(event) {
  event.preventDefault();
  const submitButton = elements.registerForm.querySelector('button[type="submit"]');
  const restore = withBusyState(submitButton, "Creating...");
  const formData = new FormData(elements.registerForm);

  const payload = {
    firstName: String(formData.get("firstName") || "").trim(),
    lastName: String(formData.get("lastName") || "").trim(),
    username: String(formData.get("username") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    password: String(formData.get("password") || ""),
  };

  try {
    const response = await apiRequest("/api/auth/register", {
      method: "POST",
      body: payload,
    });

    state.createdUserSession = {
      userId: response.userId,
      email: payload.email,
      username: payload.username,
      message: response.message
        ? `${response.message} Account: ${payload.email} (@${payload.username}).`
        : `${payload.email} (@${payload.username}) was registered successfully.`,
    };

    elements.registerForm.reset();
    renderCreatedUserPanel();
    showToast(
      `Created user #${response.userId}. Email verification is still required before login.`,
      "success",
    );
  } catch (error) {
    showToast(error.message || "Unable to create the account.", "error");
  } finally {
    restore();
  }
}

async function handleApplicationsListClick(event) {
  const actionButton = event.target.closest("button[data-action]");
  if (!actionButton) return;

  if (!hasAdminSession()) {
    showToast("Sign in as an admin before reviewing requests.", "warning");
    return;
  }

  const applicationId = Number(actionButton.dataset.id);
  const action = actionButton.dataset.action;
  const selectedApplication = state.placeOwnerApplications.find(
    (application) => Number(application.id) === applicationId,
  );

  if (!selectedApplication) {
    showToast("The selected request could not be found.", "warning");
    return;
  }

  if (selectedApplication.status !== "Pending") {
    showToast("Only pending requests can be reviewed.", "warning");
    return;
  }

  const restore = withBusyState(
    actionButton,
    action === "approve-application" ? "Approving..." : "Rejecting...",
  );

  try {
    if (action === "approve-application") {
      const adminNotes = window.prompt(
        `Approve "${selectedApplication.businessName}"?\n\nOptional admin notes:`,
        selectedApplication.adminNotes || "",
      );

      if (adminNotes === null) {
        return;
      }

      await apiRequest(
        `/api/admin/place-owner-applications/${applicationId}/approve`,
        {
          method: "POST",
          body: {
            adminNotes: adminNotes.trim() || null,
          },
        },
      );

      await refreshDashboard({ quiet: true });
      showToast("Request approved successfully.", "success");
      return;
    }

    if (action === "reject-application") {
      const rejectionReason = window.prompt(
        `Reject "${selectedApplication.businessName}"?\n\nRejection reason:`,
        selectedApplication.rejectionReason || "",
      );

      if (rejectionReason === null) {
        return;
      }

      if (!rejectionReason.trim()) {
        showToast("A rejection reason is required.", "warning");
        return;
      }

      const adminNotes = window.prompt(
        "Optional admin notes:",
        selectedApplication.adminNotes || "",
      );

      if (adminNotes === null) {
        return;
      }

      await apiRequest(
        `/api/admin/place-owner-applications/${applicationId}/reject`,
        {
          method: "POST",
          body: {
            rejectionReason: rejectionReason.trim(),
            adminNotes: adminNotes.trim() || null,
          },
        },
      );

      await refreshDashboard({ quiet: true });
      showToast("Request rejected successfully.", "success");
    }
  } catch (error) {
    showToast(error.message || "Unable to review the request.", "error");
  } finally {
    restore();
  }
}

async function dismissReport(report) {
  const note = window.prompt(
    `Dismiss report #${report.id}?\n\nOptional admin note:`,
    "",
  );

  if (note === null) {
    return false;
  }

  await apiRequest(`/api/admin/reports/${report.id}/dismiss`, {
    method: "POST",
    body: {
      note: note.trim() || null,
    },
  });

  showToast(`Report #${report.id} dismissed.`, "success");
  return true;
}

async function markReportReviewed(report) {
  const note = window.prompt(
    `Mark report #${report.id} as reviewed?\n\nOptional admin note:`,
    report.description || "",
  );

  if (note === null) {
    return false;
  }

  await apiRequest(`/api/admin/reports/${report.id}/resolve`, {
    method: "POST",
    body: {
      status: "Reviewed",
      note: note.trim() || null,
    },
  });

  showToast(`Report #${report.id} marked as reviewed.`, "success");
  return true;
}

async function takeUserReportAction(report, targetDetails) {
  const userId = Number(report.targetId);
  if (!Number.isFinite(userId)) {
    throw new Error("The reported user id is invalid.");
  }

  if (targetDetails?.state === "ready" && !targetDetails.data?.isBanned) {
    const username = targetDetails.data.username || `user-${userId}`;
    const reason = window.prompt(
      `Ban @${username} and resolve report #${report.id}?\n\nOptional ban reason:`,
      report.description || "",
    );

    if (reason === null) {
      return false;
    }

    await apiRequest(`/api/admin/users/${userId}/ban`, {
      method: "POST",
      body: {
        reason: reason.trim() || null,
      },
    });

    await apiRequest(`/api/admin/reports/${report.id}/resolve`, {
      method: "POST",
      body: {
        status: "ActionTaken",
        note: reason.trim() || "Banned reported user.",
      },
    });

    showToast(`@${username} was banned and the report was resolved.`, "success");
    return true;
  }

  const note = window.prompt(
    `Mark report #${report.id} as action taken?\n\nOptional admin note:`,
    targetDetails?.state === "ready" && targetDetails.data?.banReason
      ? targetDetails.data.banReason
      : "",
  );

  if (note === null) {
    return false;
  }

  await apiRequest(`/api/admin/reports/${report.id}/resolve`, {
    method: "POST",
    body: {
      status: "ActionTaken",
      note: note.trim() || "Confirmed moderation action on reported user.",
    },
  });

  showToast(`Report #${report.id} marked as action taken.`, "success");
  return true;
}

async function takeForumPostReportAction(report, targetDetails) {
  const note = window.prompt(
    targetDetails?.state === "ready"
      ? `Delete the reported forum post and resolve report #${report.id}?\n\nOptional admin note:`
      : `Mark report #${report.id} as action taken?\n\nOptional admin note:`,
    targetDetails?.state === "ready"
      ? "Deleted reported forum post."
      : "",
  );

  if (note === null) {
    return false;
  }

  if (targetDetails?.state === "ready") {
    const confirmed = window.confirm(
      `Delete this reported forum post by ${targetDetails.data.userName || "the original author"}?`,
    );

    if (!confirmed) {
      return false;
    }

    try {
      await apiRequest(`/api/admin/forum-posts/${report.targetId}`, {
        method: "DELETE",
      });
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 404)) {
        throw error;
      }
    }
  }

  await apiRequest(`/api/admin/reports/${report.id}/resolve`, {
    method: "POST",
    body: {
      status: "ActionTaken",
      note: note.trim() || "Moderated reported forum post.",
    },
  });

  showToast(`Report #${report.id} marked as action taken.`, "success");
  return true;
}

async function takeReportAction(report) {
  const targetDetails =
    state.reportTargetDetails[getReportTargetCacheKey(report.targetType, report.targetId)] ||
    null;

  if (report.targetType === "User") {
    return takeUserReportAction(report, targetDetails);
  }

  return takeForumPostReportAction(report, targetDetails);
}

async function updateAiModerationPost(post, status) {
  const aiLabel = post?.moderation?.aiLabel || null;
  const isPublishingHiddenPost =
    status === "Reviewed" && post?.moderation?.status === "AutoHidden";
  const defaultNote =
    status === "AutoHidden"
      ? post?.moderation?.aiReason || "Confirmed the AI moderation result and kept the post hidden."
      : isPublishingHiddenPost
        ? "Reviewed the AI moderation result and made the post visible to the public."
        : "Reviewed the AI moderation result and left the post visible.";
  const promptLabel =
    status === "AutoHidden"
      ? `Keep forum post ${post.id} hidden?

Optional admin note:`
      : isPublishingHiddenPost
        ? `Make forum post ${post.id} visible to the public again?

Optional admin note:`
        : `Mark forum post ${post.id} as reviewed?

Optional admin note:`;

  const note = window.prompt(promptLabel, post?.moderation?.adminNotes || defaultNote);
  if (note === null) {
    return false;
  }

  await apiRequest(`/api/admin/forum-posts/${post.id}/moderation-review`, {
    method: "POST",
    body: {
      status,
      finalModerationLabel: status === "AutoHidden" ? aiLabel : null,
      adminNotes: note.trim() || null,
    },
  });

  showToast(
    status === "AutoHidden"
      ? `Forum post ${post.id} was kept hidden.`
      : isPublishingHiddenPost
        ? `Forum post ${post.id} is public again.`
        : `Forum post ${post.id} was marked as reviewed.`,
    "success",
  );
  return true;
}

async function deleteAiModerationPost(post) {
  const confirmed = window.confirm(
    `Delete the AI-flagged forum post by ${post.userName || "the original author"}?`,
  );

  if (!confirmed) {
    return false;
  }

  await apiRequest(`/api/admin/forum-posts/${post.id}`, {
    method: "DELETE",
  });

  showToast(`Forum post ${post.id} was deleted.`, "success");
  return true;
}

async function handleAiModerationListClick(event) {
  const actionButton = event.target.closest("button[data-action]");
  if (!actionButton) return;

  const action = actionButton.dataset.action;
  if (!["auto-hide-ai-post", "review-ai-post", "confirm-ai-post-hidden", "publish-ai-post", "delete-ai-post"].includes(action)) {
    return;
  }

  if (!hasAdminSession()) {
    showToast("Sign in as an admin before reviewing AI-flagged posts.", "warning");
    return;
  }

  const postId = String(actionButton.dataset.id || "");
  const post = state.aiModerationPosts.find((item) => item.id === postId);

  if (!post) {
    showToast("The selected AI-moderated post could not be found.", "warning");
    return;
  }

  const restore = withBusyState(
    actionButton,
    action === "delete-ai-post"
      ? "Deleting..."
      : action === "publish-ai-post"
        ? "Publishing..."
      : action === "review-ai-post"
        ? "Reviewing..."
        : "Updating...",
  );

  try {
    const didUpdate =
      action === "delete-ai-post"
        ? await deleteAiModerationPost(post)
        : action === "publish-ai-post"
          ? await updateAiModerationPost(post, "Reviewed")
        : action === "review-ai-post"
          ? await updateAiModerationPost(post, "Reviewed")
          : await updateAiModerationPost(post, "AutoHidden");

    if (!didUpdate) {
      return;
    }

    await refreshReports({ quiet: true });
  } catch (error) {
    showToast(error.message || "Unable to review the AI-moderated post.", "error");
  } finally {
    restore();
  }
}

async function handleReportsListClick(event) {
  const actionButton = event.target.closest("button[data-action]");
  if (!actionButton) return;

  const action = actionButton.dataset.action;
  if (!["dismiss-report", "review-report", "take-report-action"].includes(action)) {
    return;
  }

  if (!hasAdminSession()) {
    showToast("Sign in as an admin before reviewing reports.", "warning");
    return;
  }

  const reportId = Number(actionButton.dataset.id);
  const report = state.reports.find((item) => Number(item.id) === reportId);

  if (!report) {
    showToast("The selected report could not be found.", "warning");
    return;
  }

  if (report.status !== "Pending") {
    showToast("Only pending reports can be reviewed.", "warning");
    return;
  }

  const restore = withBusyState(
    actionButton,
    action === "dismiss-report"
      ? "Dismissing..."
      : action === "review-report"
        ? "Reviewing..."
        : "Applying...",
  );

  try {
    const didUpdate =
      action === "dismiss-report"
        ? await dismissReport(report)
        : action === "review-report"
          ? await markReportReviewed(report)
          : await takeReportAction(report);

    if (!didUpdate) {
      return;
    }

    await refreshDashboard({ quiet: true });
  } catch (error) {
    showToast(error.message || "Unable to review the report.", "error");
  } finally {
    restore();
  }
}

async function handlePlaceSubmit(event) {
  event.preventDefault();

  if (!hasAdminSession()) {
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
      schedule:
        state.editingPlaceSchedule.length > 0
          ? state.editingPlaceSchedule.map(normalizeScheduleEntry)
          : buildDefaultWeeklySchedule(),
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
    if (!hasAdminSession()) {
      showToast("Sign in before editing places.", "warning");
      return;
    }

    populatePlaceForm(selectedPlace);
    return;
  }

  if (action === "delete-place") {
    if (!hasAdminSession()) {
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
  elements.registerForm.addEventListener("submit", handleRegisterSubmit);
  elements.placeForm.addEventListener("submit", handlePlaceSubmit);
  elements.refreshAllButton.addEventListener("click", () => refreshDashboard());
  elements.refreshPlacesButton.addEventListener("click", () => refreshDashboard());
  elements.refreshApplicationsButton.addEventListener("click", () => refreshDashboard());
  elements.refreshReportsButton?.addEventListener("click", () => refreshReports());
  elements.resetPlaceFormButton.addEventListener("click", resetPlaceForm);
  elements.sidebarLogoutButton.addEventListener("click", handleLogout);
  elements.loginForm?.addEventListener("submit", handleLoginSubmit);
  elements.mainLogoutButton?.addEventListener("click", handleLogout);

  elements.placeSearchInput.addEventListener("input", renderPlaces);
  elements.placeTypeFilter.addEventListener("change", renderPlaces);
  elements.placeStatusFilter.addEventListener("change", renderPlaces);
  elements.applicationStatusFilter.addEventListener(
    "change",
    renderPlaceOwnerApplications,
  );
  elements.applicationTypeFilter.addEventListener(
    "change",
    renderPlaceOwnerApplications,
  );
  elements.reportStatusFilter?.addEventListener("change", () => refreshReports({ quiet: true }));
  elements.reportTargetTypeFilter?.addEventListener("change", () => refreshReports({ quiet: true }));
  elements.reportPriorityFilter?.addEventListener("change", () => refreshReports({ quiet: true }));
  elements.reportSortFilter?.addEventListener("change", () => refreshReports({ quiet: true }));
  elements.placesTableBody.addEventListener("click", handlePlaceTableClick);
  elements.applicationsList.addEventListener("click", handleApplicationsListClick);
  elements.reportsList?.addEventListener("click", handleReportsListClick);
  elements.aiModerationList?.addEventListener("click", handleAiModerationListClick);
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

  if (IS_ADMIN_LOGIN_ROUTE && hasAdminSession()) {
    redirectToAdminDashboard();
  }
}

init();
}
