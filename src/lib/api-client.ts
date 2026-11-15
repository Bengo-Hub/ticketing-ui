import axios from "axios";

const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://ticketingapi.codevertexafrica.com";
export const NORMALISED_BASE_URL = DEFAULT_BASE_URL.endsWith("/")
  ? DEFAULT_BASE_URL
  : `${DEFAULT_BASE_URL}/`;

let accessTokenGetter: () => string | null = () => null;

export const api = axios.create({
  baseURL: NORMALISED_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = accessTokenGetter();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (typeof window !== "undefined") {
    const isPlatformOwner = localStorage.getItem("is_platform_owner") === "true";
    if (!isPlatformOwner) {
      const tenantId = localStorage.getItem("tenantId");
      if (tenantId) config.headers["X-Tenant-ID"] = tenantId;
      const tenantSlug = localStorage.getItem("tenantSlug");
      if (tenantSlug) config.headers["X-Tenant-Slug"] = tenantSlug;
    }
  }
  return config;
});

export function attachAuthTokenGetter(getter: () => string | null) {
  accessTokenGetter = getter;
}

let on401Callback: (() => void) | null = null;

export function setOn401(callback: (() => void) | null) {
  on401Callback = callback;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      if (!accessTokenGetter()) return Promise.reject(error);
      const url: string = error.config?.url ?? "";
      if (!url.includes("/auth/me") && !error.config?._retried) {
        const sent = String(error.config?.headers?.Authorization ?? "").replace(/^Bearer\s+/i, "");
        const { refreshAccessToken } = await import("@/lib/auth/token-refresh");
        const newToken = await refreshAccessToken(sent || accessTokenGetter());
        if (newToken) {
          error.config._retried = true;
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return api.request(error.config);
        }
        on401Callback?.();
      } else if (error.config?._retried) {
        // Even a freshly renewed token was refused: the session is unusable, so send the person
        // to sign in instead of leaving a page where every save fails.
        on401Callback?.();
      }
    }
    return Promise.reject(error);
  },
);
