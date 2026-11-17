import { api } from "@/lib/api-client";
import type {
  AiClassification,
  AiClassifyRequest,
  AiKBDraft,
  AiKBSuggestions,
  AiReply,
  AiSettings,
  AiSummary,
} from "@/types/ai";

// ticketing-api's AI routes (docs/ai.md). Each call carries the Idempotency-Key of the click that
// started it, so a retry of that click is answered again without a second charge.

const keyHeader = (key: string) => ({ headers: { "Idempotency-Key": key } });

/** Needs ticketing.tickets.view and ticketing.tickets.add. Nothing is saved. */
export async function classifyDraft(tenantSlug: string, body: AiClassifyRequest, key: string): Promise<AiClassification> {
  const { data } = await api.post<AiClassification>(`api/v1/${tenantSlug}/ai/classify`, body, keyHeader(key));
  return data;
}

/** Needs ticketing.tickets.view. */
export async function summarizeTicket(tenantSlug: string, ticketId: string, key: string): Promise<AiSummary> {
  const { data } = await api.post<AiSummary>(`api/v1/${tenantSlug}/ai/tickets/${ticketId}/summary`, undefined, keyHeader(key));
  return data;
}

/** Needs ticketing.tickets.view and ticketing.comments.add. The draft is never sent. */
export async function suggestReply(tenantSlug: string, ticketId: string, key: string): Promise<AiReply> {
  const { data } = await api.post<AiReply>(`api/v1/${tenantSlug}/ai/tickets/${ticketId}/reply`, undefined, keyHeader(key));
  return data;
}

/** Needs ticketing.tickets.view and ticketing.kb.view. */
export async function suggestArticles(tenantSlug: string, ticketId: string, key: string): Promise<AiKBSuggestions> {
  const { data } = await api.post<AiKBSuggestions>(
    `api/v1/${tenantSlug}/ai/tickets/${ticketId}/kb-suggestions`,
    undefined,
    keyHeader(key),
  );
  return data;
}

/** Needs ticketing.tickets.view and ticketing.kb.add. Only for a resolved or closed ticket. */
export async function draftArticle(tenantSlug: string, ticketId: string, key: string): Promise<AiKBDraft> {
  const { data } = await api.post<AiKBDraft>(`api/v1/${tenantSlug}/ai/tickets/${ticketId}/kb-draft`, undefined, keyHeader(key));
  return data;
}

/** Needs ticketing.settings.manage. */
export async function getAiSettings(tenantSlug: string): Promise<AiSettings> {
  const { data } = await api.get<AiSettings>(`api/v1/${tenantSlug}/settings/ai`);
  return data;
}

/** Needs ticketing.settings.manage. Returns the saved settings. */
export async function updateAiSettings(tenantSlug: string, payload: AiSettings): Promise<AiSettings> {
  const { data } = await api.put<AiSettings>(`api/v1/${tenantSlug}/settings/ai`, payload);
  return data;
}
