/**
 * Public support requests from the /support page. The visitor proves their email with a
 * six-digit code from auth-api's public codes (POST /api/v1/auth/public-otp/send and /verify),
 * and the one-use otp_token opens a ticket for the chosen tenant at
 * POST {ticketing-api}/api/v1/{tenant}/public/tickets with the X-OTP-Token header. ticketing-api
 * trades the token for the verified address, so the ticket's email is never a typed field.
 *
 * Plain fetch, not the shared axios client: a public request must not carry a signed-in
 * user's bearer token or tenant headers, and a refused code must not trigger a session refresh.
 */
import { extractErrorMessage } from "@bengo-hub/shared-ui-lib/documents";
import { NORMALISED_BASE_URL } from "@/lib/api-client";
import { AUTH_API_URL } from "@/lib/api/tenant";

export interface PublicTicketResult {
  ticket_id?: string;
  ticket_number?: string;
  status?: string;
}

export interface PublicTicketInput {
  name: string;
  subject: string;
  description: string;
}

const AUTH_BASE = AUTH_API_URL.replace(/\/+$/, "");

async function post<T>(url: string, payload: unknown, headers: Record<string, string> = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", ...headers },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("We could not reach the support desk. Check your connection and try again.");
  }
  if (!res.ok) {
    if (res.status === 429) throw new Error("Too many requests just now. Please wait a few minutes and try again.");
    if (res.status >= 500) throw new Error("That did not go through on our side. Please try again.");
    throw new Error(await extractErrorMessage(res, "That did not go through. Please try again."));
  }
  return ((await res.json().catch(() => null)) ?? {}) as T;
}

/** Emails a six-digit code to the visitor. The tenant slug brands the email. */
export async function sendSupportCode(tenantSlug: string, email: string): Promise<void> {
  await post(`${AUTH_BASE}/api/v1/auth/public-otp/send`, { email, tenant_slug: tenantSlug });
}

/** Trades the code for the one-use token a ticket needs. */
export async function verifySupportCode(email: string, otp: string): Promise<string> {
  const res = await post<{ otp_token?: string }>(`${AUTH_BASE}/api/v1/auth/public-otp/verify`, { email, otp });
  if (!res.otp_token) throw new Error("We could not verify the code. Please request a new one.");
  return res.otp_token;
}

/** Opens the ticket in the tenant's desk. The token works once. */
export function createPublicTicket(
  tenantSlug: string,
  otpToken: string,
  input: PublicTicketInput,
): Promise<PublicTicketResult> {
  return post<PublicTicketResult>(
    `${NORMALISED_BASE_URL}api/v1/${encodeURIComponent(tenantSlug)}/public/tickets`,
    { ...input, channel: "web" },
    { "X-OTP-Token": otpToken },
  );
}
