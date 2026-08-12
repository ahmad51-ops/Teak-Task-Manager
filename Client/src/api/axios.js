import axios from "axios";

// In-memory only — never localStorage/sessionStorage for the access
// token (an XSS vector reading localStorage could steal it; a memory
// variable can't be read by an injected script the same way). This is
// deliberately lost on a full page reload — restoreSession() in
// authApi.js uses the httpOnly refreshToken cookie to silently get a
// new one instead.
let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

// In local dev, VITE_API_URL is unset and requests go to "/api/v1" on
// this same origin, which the Vite dev proxy (vite.config.js) forwards
// to the backend. In production, frontend (Vercel) and backend (Render)
// are different origins, so this needs the backend's actual URL instead.
const apiBaseUrl = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : "/api/v1";

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true, // required so the httpOnly refreshToken cookie is sent
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Requests that should NEVER trigger a refresh-and-retry — retrying
// these on 401 would either loop forever or make no sense.
const NO_REFRESH_PATHS = ["/auth/login", "/auth/register", "/auth/refresh-token"];

let isRefreshing = false;
let pendingQueue = [];

const flushQueue = (error, token = null) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  pendingQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint = NO_REFRESH_PATHS.some((path) => originalRequest?.url?.includes(path));

    if (error.response?.status !== 401 || originalRequest._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    // A second request that fails while a refresh is already in flight
    // waits for that same refresh instead of firing its own — avoids a
    // burst of parallel refresh calls if several requests 401 at once.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await api.post("/auth/refresh-token");
      const newToken = data.data.accessToken;
      setAccessToken(newToken);
      flushQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      flushQueue(refreshError, null);
      setAccessToken(null);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
