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

/** The slim public view of a ticket that ticketing-api's read-by-number route returns. */
export interface PublicTicketView {
  ticket_number: string;
  status: string;
  subject: string;
  channel?: string;
  created_at: string;
  updated_at: string;
}

function ticketURL(tenantSlug: string, ticketNumber?: string): string {
  const base = `${NORMALISED_BASE_URL}api/v1/${encodeURIComponent(tenantSlug)}/public/tickets`;
  return ticketNumber ? `${base}/${encodeURIComponent(ticketNumber)}` : base;
}

function post<T>(url: string, payload: unknown, headers: Record<string, string> = {}): Promise<T> {
  return send<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(payload),
  });
}

/** A failed public call, carrying the HTTP status so a page can word its own message. */
export class PublicSupportError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PublicSupportError";
    this.status = status;
  }
}

async function send<T>(
  url: string,
  init: Omit<RequestInit, "headers"> & { headers?: Record<string, string> },
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers: { Accept: "application/json", ...init.headers } });
  } catch {
    throw new PublicSupportError("We could not reach the support desk. Check your connection and try again.", 0);
  }
  if (!res.ok) {
    if (res.status === 429) {
      throw new PublicSupportError("Too many requests just now. Please wait a few minutes and try again.", 429);
    }
    if (res.status >= 500) {
      throw new PublicSupportError("That did not go through on our side. Please try again.", res.status);
    }
    throw new PublicSupportError(
      await extractErrorMessage(res, "That did not go through. Please try again."),
      res.status,
    );
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
  return post<PublicTicketResult>(ticketURL(tenantSlug), { ...input, channel: "web" }, { "X-OTP-Token": otpToken });
}

/** Reads a ticket's public view by its number. */
export function getPublicTicket(tenantSlug: string, ticketNumber: string): Promise<PublicTicketView> {
  return send<PublicTicketView>(ticketURL(tenantSlug, ticketNumber), { method: "GET" });
}

/**
 * Adds the requester's reply. ticketing-api accepts it only when the token's verified email is
 * the ticket's requester email, and the token works once, so each reply needs a fresh code.
 */
export function addPublicReply(
  tenantSlug: string,
  ticketNumber: string,
  otpToken: string,
  content: string,
): Promise<{ comment_id?: string; created_at?: string }> {
  return post(`${ticketURL(tenantSlug, ticketNumber)}/comments`, { content }, { "X-OTP-Token": otpToken });
}
