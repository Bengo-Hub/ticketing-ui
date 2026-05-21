import type { AuthResponse } from "@/lib/auth/types";

const SSO_BASE_URL =
  process.env.NEXT_PUBLIC_SSO_URL ?? "https://sso.codevertexitsolutions.com";
const SSO_CLIENT_ID = process.env.NEXT_PUBLIC_SSO_CLIENT_ID ?? "ticketing-ui";

export function buildAuthorizeUrl(params: {
  codeChallenge: string;
  state: string;
  redirectUri: string;
  scope?: string;
  tenant?: string;
}): string {
  const url = new URL("/api/v1/authorize", SSO_BASE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", SSO_CLIENT_ID);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("scope", params.scope ?? "openid profile email offline_access");
  url.searchParams.set("state", params.state);
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  if (params.tenant) url.searchParams.set("tenant", params.tenant);
  return url.toString();
}

export function buildLogoutUrl(postLogoutRedirectUri?: string): string {
  const url = new URL("/api/v1/auth/logout", SSO_BASE_URL);
  if (postLogoutRedirectUri) {
    url.searchParams.set("post_logout_redirect_uri", postLogoutRedirectUri);
  }
  return url.toString();
}

export async function exchangeCodeForTokens(params: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<{
  access_token: string;
  id_token: string;
  token_type: string;
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
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as { error_description?: string; error?: string }).error_description ||
      (errorData as { error?: string }).error ||
      "Token exchange failed"
    );
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
  });
  if (!response.ok) throw new Error("Token refresh failed");
  return response.json();
}

export async function fetchProfile(accessToken?: string): Promise<AuthResponse> {
  const token =
    accessToken ??
    (typeof window !== "undefined"
      ? (() => {
          try {
            const s = JSON.parse(localStorage.getItem("ticketing_auth") ?? "{}") as {
              session?: { accessToken?: string };
            };
            return s.session?.accessToken ?? null;
          } catch {
            return null;
          }
        })()
      : null);

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${SSO_BASE_URL}/api/v1/auth/me`, { headers });
  if (!res.ok) {
    const err: { message: string; response: { status: number } } = {
      message: res.status === 401 ? "Unauthorized" : "SSO /me failed",
      response: { status: res.status },
    };
    throw err;
  }
  const data = (await res.json()) as Record<string, unknown>;
  const roles = Array.isArray(data.roles)
    ? (data.roles as string[])
    : data.role
    ? [data.role as string]
    : [];

  const profile = data.profile as Record<string, unknown> | undefined;

  const user = {
    id: (data.id as string) ?? "",
    email: (data.email as string) ?? "",
    fullName: (data.fullName as string) ?? (data.full_name as string) ?? (data.email as string) ?? "",
    firstName: (profile?.first_name as string) ?? "",
    lastName: (profile?.last_name as string) ?? "",
    roles: roles as import("@/lib/auth/types").UserRole[],
    role: roles[0] ?? "",
    permissions: Array.isArray(data.permissions) ? (data.permissions as string[]) : [],
    tenantId: (data.tenant_id as string) ?? "",
    tenantSlug: (data.tenant_slug as string) ?? "",
    isPlatformOwner: data.is_platform_owner === true,
    isSuperUser: roles.includes("superuser"),
    phone: (profile?.phone as string) ?? "",
  };
  return {
    user,
    session: { accessToken: token ?? "", refreshToken: "", expiresAt: "", sessionId: "" },
  };
}
