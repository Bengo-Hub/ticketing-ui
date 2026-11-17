import { errorStatus, revokeServerSession as sharedRevokeServerSession } from "@bengo-hub/shared-ui-lib/auth";
import { isSubscription403 } from "@/lib/api-client";
import type { UserProfile, UserRole } from "@/lib/auth/types";

const SSO_BASE_URL = process.env.NEXT_PUBLIC_SSO_URL || "https://sso.codevertexafrica.com";
const SSO_CLIENT_ID = process.env.NEXT_PUBLIC_SSO_CLIENT_ID || "ticketing-ui";

/** SSO auth/me: the profile always comes from auth-api, never from ticketing-api. */
export const SSO_ME_URL = `${SSO_BASE_URL}/api/v1/auth/me`;

/** No sign-in call may hang the app: a request auth-api has not answered by then counts as an outage. */
const AUTH_TIMEOUT_MS = 15_000;

export interface AuthorizeParams {
  codeChallenge: string;
  state: string;
  redirectUri: string;
  scope?: string;
  /** The tenant in the URL, so the token is minted for it. */
  tenant?: string;
}

export interface TokenExchangeParams {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}

/** An auth-api answer that failed, carrying its status the way the shared `errorStatus` reads it. */
function httpError(message: string, status: number, data?: unknown): Error {
  return Object.assign(new Error(message), { status, response: { status, data } });
}

export function buildAuthorizeUrl({ codeChallenge, state, redirectUri, scope, tenant }: AuthorizeParams): string {
  const url = new URL("/api/v1/authorize", SSO_BASE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", SSO_CLIENT_ID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", scope || "openid profile email offline_access");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  if (tenant) url.searchParams.set("tenant", tenant);
  return url.toString();
}

export function buildLogoutUrl(postLogoutRedirectUri?: string): string {
  const url = new URL("/api/v1/auth/logout", SSO_BASE_URL);
  if (postLogoutRedirectUri) url.searchParams.set("post_logout_redirect_uri", postLogoutRedirectUri);
  return url.toString();
}

export async function revokeServerSession(accessToken?: string | null): Promise<void> {
  return sharedRevokeServerSession(SSO_BASE_URL, accessToken);
}

export async function exchangeCodeForTokens(params: TokenExchangeParams): Promise<{
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri,
    client_id: SSO_CLIENT_ID,
    code_verifier: params.codeVerifier,
  });
  const response = await fetch(`${SSO_BASE_URL}/api/v1/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    signal: AbortSignal.timeout(AUTH_TIMEOUT_MS),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error_description?: string; error?: string };
    throw httpError(data.error_description || data.error || "Token exchange failed", response.status, data);
  }
  return response.json();
}

export async function refreshTokens(refreshToken: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}> {
  const response = await fetch(`${SSO_BASE_URL}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken, client_id: SSO_CLIENT_ID }),
    signal: AbortSignal.timeout(AUTH_TIMEOUT_MS),
  });
  // The status tells the shared refresher a refused session (sign in again) from an outage. A
  // timeout throws with no status, which the refresher treats as an outage.
  if (!response.ok) throw httpError("Token refresh failed", response.status);
  return response.json();
}

/**
 * Whether auth-api refused the session itself: a 401, or a 403 that is not a subscription
 * refusal. Such a session is cleared and the person signs in again; anything else is an outage
 * and keeps the session.
 */
export function isSessionRefusal(error: unknown): boolean {
  const status = errorStatus(error);
  if (status === 401) return true;
  if (status !== 403) return false;
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  return !isSubscription403(data);
}

/** The SSO profile (identity and global roles) for an access token. */
export async function fetchProfile(accessToken: string): Promise<UserProfile> {
  const res = await fetch(SSO_ME_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(AUTH_TIMEOUT_MS),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error_description?: string; error?: string };
    throw httpError(data.error_description || data.error || `Profile failed: ${res.status}`, res.status, data);
  }
  const data = (await res.json()) as Record<string, unknown>;
  const profile = (data.profile ?? {}) as Record<string, unknown>;
  const tenant = (data.tenant ?? {}) as Record<string, unknown>;
  const roles = (Array.isArray(data.roles) ? data.roles : []) as UserRole[];
  const email = (data.email as string) ?? "";
  return {
    id: (data.id as string) ?? "",
    email,
    fullName: (profile.name as string) ?? (data.full_name as string) ?? email,
    firstName: (profile.first_name as string) ?? "",
    lastName: (profile.last_name as string) ?? "",
    roles,
    permissions: Array.isArray(data.permissions) ? (data.permissions as string[]) : [],
    tenantId: (data.tenant_id as string) ?? (data.primary_tenant as string) ?? "",
    tenantSlug: (data.tenant_slug as string) ?? (tenant.slug as string) ?? "",
    isPlatformOwner: data.is_platform_owner === true,
    isSuperUser: roles.includes("superuser"),
    email_verification: data.email_verification as UserProfile["email_verification"],
  };
}
