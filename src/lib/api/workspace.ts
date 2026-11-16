import { api } from "@/lib/api-client";
import type { AttachmentLink, CursorPage, TicketAttachment } from "@/types/tickets";
import type {
  CreateLinkData,
  Macro,
  MacroApplied,
  MacroInput,
  PresenceEntry,
  PresenceResponse,
  PresenceState,
  TicketLinkView,
  TicketView,
  ViewInput,
} from "@/types/workspace";

// Saved views, macros, links, presence and attachments. Every route but attachments is staff only.

const base = (slug: string) => `api/v1/${slug}`;

// Saved views: the caller's own and the tenant's shared ones.

export async function getViews(slug: string): Promise<TicketView[]> {
  const { data } = await api.get<{ data?: TicketView[] }>(`${base(slug)}/views`);
  return data.data ?? [];
}

export async function createView(slug: string, payload: ViewInput): Promise<TicketView> {
  const { data } = await api.post<TicketView>(`${base(slug)}/views`, payload);
  return data;
}

export async function updateView(slug: string, id: string, payload: ViewInput): Promise<TicketView> {
  const { data } = await api.put<TicketView>(`${base(slug)}/views/${id}`, payload);
  return data;
}

export async function deleteView(slug: string, id: string): Promise<void> {
  await api.delete(`${base(slug)}/views/${id}`);
}

// Macros.

export async function getMacros(slug: string, activeOnly = false): Promise<Macro[]> {
  const { data } = await api.get<{ data?: Macro[] }>(`${base(slug)}/macros`, {
    params: activeOnly ? { active: true } : undefined,
  });
  return data.data ?? [];
}

export async function createMacro(slug: string, payload: MacroInput): Promise<Macro> {
  const { data } = await api.post<Macro>(`${base(slug)}/macros`, payload);
  return data;
}

export async function updateMacro(slug: string, id: string, payload: MacroInput): Promise<Macro> {
  const { data } = await api.put<Macro>(`${base(slug)}/macros/${id}`, payload);
  return data;
}

export async function deleteMacro(slug: string, id: string): Promise<void> {
  await api.delete(`${base(slug)}/macros/${id}`);
}

export async function applyMacro(slug: string, ticketId: string, macroId: string): Promise<MacroApplied> {
  const { data } = await api.post<MacroApplied>(`${base(slug)}/tickets/${ticketId}/macros/${macroId}/apply`);
  return data;
}

// Links between tickets.

export async function getTicketLinks(slug: string, ticketId: string): Promise<TicketLinkView[]> {
  const { data } = await api.get<{ data?: TicketLinkView[] }>(`${base(slug)}/tickets/${ticketId}/links`);
  return data.data ?? [];
}

export async function createTicketLink(slug: string, ticketId: string, payload: CreateLinkData): Promise<void> {
  await api.post(`${base(slug)}/tickets/${ticketId}/links`, payload);
}

export async function deleteTicketLink(slug: string, ticketId: string, linkId: string): Promise<void> {
  await api.delete(`${base(slug)}/tickets/${ticketId}/links/${linkId}`);
}

// Collision presence. The API keeps an entry for about 30 seconds after the last refresh.

export async function getPresence(slug: string, ticketId: string): Promise<PresenceEntry[]> {
  const { data } = await api.get<PresenceResponse>(`${base(slug)}/tickets/${ticketId}/presence`);
  return data.data ?? [];
}

export async function setPresence(slug: string, ticketId: string, state: PresenceState): Promise<PresenceEntry[]> {
  const { data } = await api.post<PresenceResponse>(`${base(slug)}/tickets/${ticketId}/presence`, { state });
  return data.data ?? [];
}

export async function leavePresence(slug: string, ticketId: string): Promise<void> {
  await api.delete(`${base(slug)}/tickets/${ticketId}/presence`);
}

// Attachments. Customers see and add files on their own tickets only, and never internal ones.

export async function getAttachments(
  slug: string,
  ticketId: string,
  cursor?: string,
  limit = 25,
): Promise<CursorPage<TicketAttachment>> {
  const { data } = await api.get<CursorPage<TicketAttachment>>(`${base(slug)}/tickets/${ticketId}/attachments`, {
    params: { cursor: cursor || undefined, limit },
  });
  return { ...data, data: data.data ?? [] };
}

export interface UploadOptions {
  commentId?: string;
  /** Staff only. The API ignores it for customers. */
  internal?: boolean;
}

/**
 * Sends one file as multipart form data. The client's default JSON content type would make axios
 * serialise the form as JSON, so the request names multipart and the browser adds the boundary.
 */
export async function uploadAttachment(
  slug: string,
  ticketId: string,
  file: File,
  opts: UploadOptions = {},
): Promise<TicketAttachment> {
  const form = new FormData();
  form.append("file", file, file.name);
  if (opts.commentId) form.append("comment_id", opts.commentId);
  if (opts.internal) form.append("internal", "true");
  const { data } = await api.post<TicketAttachment>(`${base(slug)}/tickets/${ticketId}/attachments`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function getAttachmentLink(slug: string, ticketId: string, attachmentId: string): Promise<AttachmentLink> {
  const { data } = await api.get<AttachmentLink>(
    `${base(slug)}/tickets/${ticketId}/attachments/${attachmentId}/download`,
  );
  return data;
}

export async function deleteAttachment(slug: string, ticketId: string, attachmentId: string): Promise<void> {
  await api.delete(`${base(slug)}/tickets/${ticketId}/attachments/${attachmentId}`);
}
