const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
const TOKEN_KEY = "applytrack_token";

export const getToken = () => window.localStorage.getItem(TOKEN_KEY);
export const saveToken = (token) => window.localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => window.localStorage.removeItem(TOKEN_KEY);

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body) headers.set("Content-Type", "application/json");

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error("Cannot reach the ApplyTrack API. Check that the backend is running.");
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

export const authApi = {
  register: (details) => request("/auth/register", {
    method: "POST",
    body: JSON.stringify(details)
  }),
  login: (details) => request("/auth/login", {
    method: "POST",
    body: JSON.stringify(details)
  }),
  me: () => request("/auth/me")
};

export const applicationApi = {
  list: () => request("/applications"),
  create: (application) => request("/applications", {
    method: "POST",
    body: JSON.stringify(application)
  }),
  get: (id) => request(`/applications/${encodeURIComponent(id)}`),
  update: (id, application) => request(`/applications/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(application)
  }),
  remove: (id) => request(`/applications/${encodeURIComponent(id)}`, { method: "DELETE" })
};
