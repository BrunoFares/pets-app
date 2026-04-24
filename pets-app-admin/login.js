const HAS_BROWSER_RUNTIME =
  typeof window !== "undefined" &&
  typeof document !== "undefined" &&
  typeof localStorage !== "undefined";

if (!HAS_BROWSER_RUNTIME) {
  const runtimeMessage =
    'pets-app-admin/login.js is a browser-only script. Start the backend with "dotnet run --project PetCare.Api/PetCare.Api/PetCare.Api.csproj" and open "http://localhost:5063/admin/login" in your browser.';

  if (typeof console !== "undefined" && typeof console.error === "function") {
    console.error(runtimeMessage);
  }

  if (typeof process !== "undefined") {
    process.exitCode = 1;
  }
} else {
  const DEFAULT_API_BASE_URL = "http://localhost:5063";
  const IS_SERVED_BY_BACKEND =
    window.location.protocol.startsWith("http") &&
    /^\/admin(\/|$)/.test(window.location.pathname);
  const API_BASE_URL = IS_SERVED_BY_BACKEND
    ? window.location.origin
    : DEFAULT_API_BASE_URL;
  const STORAGE_KEYS = {
    token: "pets-admin.access-token",
    userId: "pets-admin.user-id",
  };

  const elements = {
    loginForm: document.querySelector("#loginForm"),
    sessionStatus: document.querySelector("#sessionStatus"),
    statusMessage: document.querySelector("#statusMessage"),
    toast: document.querySelector("#toast"),
  };

  const state = {
    toastTimer: null,
  };

  class ApiError extends Error {
    constructor(message, status, payload) {
      super(message);
      this.name = "ApiError";
      this.status = status;
      this.payload = payload;
    }
  }

  function clearStoredStandaloneSession() {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.userId);
  }

  function setStatus(message) {
    elements.sessionStatus.textContent = message;
    elements.statusMessage.textContent = message;
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

    if (payload.errors && typeof payload.errors === "object") {
      const combined = Object.values(payload.errors)
        .flat()
        .filter(Boolean)
        .join(" ");

      if (combined) return combined;
    }

    return null;
  }

  function tryParseJson(raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async function apiRequest(path, options = {}) {
    const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
    const headers = new Headers(options.headers || {});
    headers.set("Accept", "application/json");

    let body = options.body;
    if (body !== undefined && body !== null && !(body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(body);
    }

    const response = await fetch(url, {
      method: options.method || "GET",
      headers,
      body,
      credentials: "same-origin",
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

  function redirectToDashboard() {
    if (!IS_SERVED_BY_BACKEND) {
      return;
    }

    window.location.replace("/admin/home");
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();
    const submitButton = elements.loginForm.querySelector('button[type="submit"]');
    const restore = withBusyState(submitButton, "Signing in...");
    const formData = new FormData(elements.loginForm);

    clearStoredStandaloneSession();

    try {
      await apiRequest("/api/admin/auth/login", {
        method: "POST",
        body: {
          email: String(formData.get("identifier") || "").trim(),
          password: String(formData.get("password") || ""),
        },
      });

      setStatus("Login successful. Opening dashboard...");
      showToast("Login successful.", "success");
      redirectToDashboard();
    } catch (error) {
      setStatus("Login failed. Please check your credentials and try again.");
      showToast(error.message || "Unable to sign in.", "error");
    } finally {
      restore();
    }
  }

  async function init() {
    clearStoredStandaloneSession();
    elements.loginForm.addEventListener("submit", handleLoginSubmit);
    setStatus("Sign in with an active admin account to continue.");
  }

  init();
}
