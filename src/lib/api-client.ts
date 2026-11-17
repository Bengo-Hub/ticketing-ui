import axios from "axios";

const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://ticketingapi.codevertexafrica.com";
export const NORMALISED_BASE_URL = DEFAULT_BASE_URL.endsWith("/")
  ? DEFAULT_BASE_URL
  : `${DEFAULT_BASE_URL}/`;

let accessTokenGetter: () => string | null = () => null;

// The signed-in tenant, set by the auth store from the SSO profile (as treasury-ui's apiClient does).
let tenantId: string | null = null;
let tenantSlug: string | null = null;
let platformOwner = false;

export function setTenantContext(id: string | null, slug: string | null) {
  tenantId = id || null;
  tenantSlug = slug || null;
}

export function setPlatformOwner(value: boolean) {
  platformOwner = value;
}

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
  if (!platformOwner) {
    if (tenantId) headers["X-Tenant-ID"] = tenantId;
    if (tenantSlug) headers["X-Tenant-Slug"] = tenantSlug;
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
    // ticketing-api's own auth/me goes through the same refresh as every other call: the SSO /me is
    // read with fetch in lib/auth/api.ts and never reaches this interceptor.
    if (error.response?.status === 401 && error.config) {
      if (!accessTokenGetter()) return Promise.reject(error);
      if (!error.config._retried) {
        const sent = String(error.config?.headers?.Authorization ?? "").replace(/^Bearer\s+/i, "");
        const { renewSession } = await import("@/lib/auth/token-refresh");
        const outcome = await renewSession(sent || accessTokenGetter());
        if ("token" in outcome) {
          error.config._retried = true;
          error.config.headers.Authorization = `Bearer ${outcome.token}`;
          return api.request(error.config);
        }
        // A refused refresh ends the session; an outage keeps it and lets this request fail softly.
        if ("rejected" in outcome) on401Callback?.();
      } else {
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
