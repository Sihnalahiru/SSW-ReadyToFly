const API = "/api";
function readCookie(name) {
  const entry = document.cookie.split("; ").find(part => part.startsWith(name + "="));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : "";
}
async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body) headers.set("Content-Type", "application/json");
  if (options.method && options.method !== "GET") {
    const csrf = readCookie("rtf_csrf");
    if (csrf) headers.set("X-CSRF-Token", csrf);
  }
  const response = await fetch(API + path, { ...options, headers, credentials: "same-origin", cache: "no-store" });
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
  register: (details) => request("/auth/register", { method:"POST", body:JSON.stringify(details) }),
  verify: (token) => request("/auth/verify", { method:"POST", body:JSON.stringify({token}) }),
  login: (email,password) => request("/auth/login", { method:"POST", body:JSON.stringify({email,password}) }),
  logout: () => request("/auth/logout", { method:"POST", body:"{}" }),
  forgotPassword: (email) => request("/auth/forgot-password", { method:"POST", body:JSON.stringify({email}) }),
  resetPassword: (token,password) => request("/auth/reset-password", { method:"POST", body:JSON.stringify({token,password}) }),
  loadProgress: async () => (await request("/progress")).items || [],
  saveProgress: (items) => request("/progress", { method:"PUT", body:JSON.stringify({items}) })
};
