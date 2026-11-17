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

/** The header ticketing-api reads a ticket access token from. */
const TICKET_ACCESS_HEADER = "X-Ticket-Access-Token";

export interface TicketAccess {
  access_token: string;
  expires_at: string;
  ticket: PublicTicketView;
}

/**
 * Trades the one-use code token for a ticket access token (about 30 minutes) scoped to this
 * ticket and email. ticketing-api answers 404 both for a missing ticket and for an email that
 * is not the ticket's requester.
 */
export async function requestTicketAccess(
  tenantSlug: string,
  ticketNumber: string,
  otpToken: string,
): Promise<TicketAccess> {
  const res = await post<Partial<TicketAccess>>(`${ticketURL(tenantSlug, ticketNumber)}/access`, {}, {
    "X-OTP-Token": otpToken,
  });
  if (!res.access_token || !res.ticket) {
    throw new PublicSupportError("We could not open this ticket. Please try again.", 500);
  }
  return res as TicketAccess;
}

/** Reads the ticket's public view with a ticket access token. */
export function getPublicTicket(tenantSlug: string, ticketNumber: string, accessToken: string): Promise<PublicTicketView> {
  return send<PublicTicketView>(ticketURL(tenantSlug, ticketNumber), {
    method: "GET",
    headers: { [TICKET_ACCESS_HEADER]: accessToken },
  });
}

/** Adds the requester's reply with the ticket access token, which works until it expires. */
export function addPublicReply(
  tenantSlug: string,
  ticketNumber: string,
  accessToken: string,
  content: string,
): Promise<{ comment_id?: string; created_at?: string }> {
  return post(`${ticketURL(tenantSlug, ticketNumber)}/comments`, { content }, { [TICKET_ACCESS_HEADER]: accessToken });
}

// The CSAT survey. The link in the resolved-ticket email carries the tenant id and a single-use
// token; both routes take no sign-in. They answer 404 for an unknown or replaced token, 409 when
// the survey was already answered and 410 when the link has expired.

/** The ticket a survey token belongs to. */
export interface CsatSurvey {
  ticket_number: string;
  subject: string;
  expires_at: string;
}

/** The longest comment the API stores. */
export const CSAT_COMMENT_MAX = 2000;

function csatURL(tenant: string, suffix = ""): string {
  return `${NORMALISED_BASE_URL}api/v1/${encodeURIComponent(tenant)}/public/csat${suffix}`;
}

/** Checks the token without using it up. */
export function checkCsatToken(tenant: string, token: string): Promise<CsatSurvey> {
  return post<CsatSurvey>(csatURL(tenant, "/check"), { token });
}

/** Stores the rating and uses up the token. */
export async function submitCsat(tenant: string, token: string, score: number, comment: string): Promise<void> {
  const trimmed = comment.trim();
  await post(csatURL(tenant), { token, score, ...(trimmed ? { comment: trimmed } : {}) });
}
