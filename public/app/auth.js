// Compatibility API adapter for ReadyToFly V2.
// The current application shell uses the auth controller in ../app.js;
// this module is retained for future modular callers and intentionally
// exposes only endpoints that exist in the V2 Worker.
const API = "/api";

function readCookie(name) {
  const entry = document.cookie.split("; ").find(part => part.startsWith(name + "="));
  if (!entry) return "";
  try {
    return decodeURIComponent(entry.slice(name.length + 1));
  } catch {
    return "";
  }
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body !== undefined) headers.set("Content-Type", "application/json");
  if (options.method && options.method !== "GET") {
    const csrf = readCookie("rtf_csrf");
    if (csrf) headers.set("X-CSRF-Token", csrf);
  }
  const response = await fetch(API + path, {
    ...options, headers, credentials: "same-origin", cache: "no-store"
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || data.error || "REQUEST_FAILED");
    error.code = data.error || "REQUEST_FAILED";
    error.status = response.status;
    throw error;
  }
  return data;
}

export const ReadyToFlyAuth = {
  me: () => request("/auth/me"),
  register: details => request("/auth/register", {
    method: "POST", body: JSON.stringify(details)
  }),
  login: (username, password) => request("/auth/login", {
    method: "POST", body: JSON.stringify({ username, password })
  }),
  logout: () => request("/auth/logout", { method: "POST", body: "{}" }),
  requestPasswordReset: username => request("/auth/reset-request", {
    method: "POST", body: JSON.stringify({ username })
  }),
  checkPasswordReset: requestDetails => request("/auth/reset-status", {
    method: "POST", body: JSON.stringify(requestDetails)
  }),
  completePasswordReset: details => request("/auth/complete-admin-reset", {
    method: "POST", body: JSON.stringify(details)
  }),
  loadProgress: async () => (await request("/progress")).items || [],
  saveProgress: items => request("/progress", {
    method: "PUT", body: JSON.stringify({ items })
  })
};
