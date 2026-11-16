import {
  fetchTenantBySlug as sharedFetchTenantBySlug,
  type TenantBrand,
} from "@bengo-hub/shared-ui-lib/tenant";

export type { TenantBrand };

/** auth-api base URL. Tenant lookups by slug are public on auth-api. */
export const AUTH_API_URL = (
  process.env.NEXT_PUBLIC_AUTH_API_URL ||
  process.env.NEXT_PUBLIC_SSO_URL ||
  "https://sso.codevertexafrica.com"
).replace(/\/+$/, "");

/** Loads a tenant's brand through the shared cached lookup. Returns null when the slug is unknown. */
export function fetchTenantBySlug(slug: string): Promise<TenantBrand | null> {
  if (!slug) return Promise.resolve(null);
  return sharedFetchTenantBySlug(slug, AUTH_API_URL);
}
