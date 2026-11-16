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

/**
 * Headers every authenticated call to ticketing-api carries: the bearer token and, for tenant users,
 * the tenant headers. Platform owners send no tenant headers (shared-docs Trinity pattern). Axios and
 * the SSE stream reader both use this, so the two never drift.
 */
export function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = accessTokenGetter();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (typeof window !== "undefined") {
    const isPlatformOwner = localStorage.getItem("is_platform_owner") === "true";
    if (!isPlatformOwner) {
      const tenantId = localStorage.getItem("tenantId");
      if (tenantId) headers["X-Tenant-ID"] = tenantId;
      const tenantSlug = localStorage.getItem("tenantSlug");
      if (tenantSlug) headers["X-Tenant-Slug"] = tenantSlug;
    }
  }
  return headers;
}

api.interceptors.request.use((config) => {
  for (const [key, value] of Object.entries(authHeaders())) config.headers[key] = value;
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
    if (error.response?.status === 403 && isSubscription403(error.response?.data)) {
      onSubscription403Callback?.(error.response.data as Subscription403Body);
    }
    return Promise.reject(error);
  },
);

/** Body of a Layer 2 (plan or subscription) refusal, per shared-docs subscription-gating-guide. */
export interface Subscription403Body {
  error?: string;
  code?: string;
  upgrade?: boolean;
}

/** A subscription 403 shows an upgrade prompt; only a permission 403 leads to the unauthorized page. */
export function isSubscription403(data: unknown): boolean {
  const body = (data ?? {}) as Subscription403Body;
  return body.upgrade === true || body.code === "subscription_inactive" || body.code === "feature_not_available";
}

let onSubscription403Callback: ((data: Subscription403Body) => void) | null = null;

export function setOnSubscription403(callback: ((data: Subscription403Body) => void) | null) {
  onSubscription403Callback = callback;
}
