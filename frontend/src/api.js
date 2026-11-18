const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const defaultApiUrl = import.meta.env.DEV
  ? "http://localhost:5000"
  : "https://applytrack-1-seei.onrender.com";
const API_BASE_URL = `${(configuredApiUrl || defaultApiUrl)
  .replace(/(?:\/api)+\/?$/i, "")
  .replace(/\/+$/, "")}/api`;
const TOKEN_KEY = "applytrack_token";

export const getToken = () => window.localStorage.getItem(TOKEN_KEY);
export const saveToken = (token) => window.localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => window.localStorage.removeItem(TOKEN_KEY);

async function request(path, options = {}) {
  if (!API_BASE_URL) {
    throw new Error("The API URL is not configured. Set VITE_API_URL to your backend URL.");
  }

  const headers = new Headers(options.headers || {});
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body) headers.set("Content-Type", "application/json");

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error("Cannot reach the ApplyTrack API. Check the API URL and the backend's CORS settings.");
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

export const interviewApi = {
  list: () => request("/interviews"),
  get: (id) => request(`/interviews/${encodeURIComponent(id)}`)
};
