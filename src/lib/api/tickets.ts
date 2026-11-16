import { api } from "@/lib/api-client";
import type {
  AddCommentData,
  Category,
  CreateCategoryData,
  CreateTicketData,
  PageResponse,
  Ticket,
  TicketAnalytics,
  TicketComment,
  TicketListParams,
  TicketListResponse,
  TicketStats,
  TicketStatus,
  UpdateCategoryData,
  UpdateTicketData,
} from "@/types/tickets";

/** `signal` lets a newer search abort the older request (the fleet debounced search standard). */
export async function getTickets(params: TicketListParams, signal?: AbortSignal): Promise<TicketListResponse> {
  const { tenantSlug, ...rest } = params;
  const { data } = await api.get<TicketListResponse>(`api/v1/${tenantSlug}/tickets`, {
    params: rest,
    signal,
  });
  return data;
}

export async function getTicket(tenantSlug: string, id: string): Promise<Ticket> {
  const { data } = await api.get<Ticket>(`api/v1/${tenantSlug}/tickets/${id}`);
  return data;
}

export async function createTicket(tenantSlug: string, payload: CreateTicketData): Promise<Ticket> {
  const { data } = await api.post<Ticket>(`api/v1/${tenantSlug}/tickets`, payload);
  return data;
}

export async function updateTicket(
  tenantSlug: string,
  id: string,
  payload: UpdateTicketData,
): Promise<void> {
  await api.put(`api/v1/${tenantSlug}/tickets/${id}`, payload);
}

export async function updateTicketStatus(
  tenantSlug: string,
  id: string,
  status: TicketStatus,
): Promise<void> {
  await api.put(`api/v1/${tenantSlug}/tickets/${id}/status`, { status });
}

/** Assigns to an agent, a team, or both (the API takes either). */
export async function assignTicket(
  tenantSlug: string,
  id: string,
  target: { agentId?: string; teamId?: string },
): Promise<void> {
  await api.put(`api/v1/${tenantSlug}/tickets/${id}/assign`, {
    agent_id: target.agentId,
    team_id: target.teamId,
  });
}

export async function deleteTicket(tenantSlug: string, id: string): Promise<void> {
  await api.delete(`api/v1/${tenantSlug}/tickets/${id}`);
}

export async function addComment(
  tenantSlug: string,
  ticketId: string,
  payload: AddCommentData,
): Promise<TicketComment> {
  const { data } = await api.post<TicketComment>(
    `api/v1/${tenantSlug}/tickets/${ticketId}/comments`,
    payload,
  );
  return data;
}

/** The API answers `{ comments, total }`; customers never receive internal notes. */
export async function getTicketComments(
  tenantSlug: string,
  ticketId: string,
): Promise<TicketComment[]> {
  const { data } = await api.get<{ comments?: TicketComment[]; total?: number }>(
    `api/v1/${tenantSlug}/tickets/${ticketId}/comments`,
  );
  return data.comments ?? [];
}

/** The API answers `{ stats: { <status>: count } }`. */
export async function getTicketStats(tenantSlug: string): Promise<TicketStats> {
  const { data } = await api.get<{ stats?: TicketStats }>(`api/v1/${tenantSlug}/tickets/stats`);
  return data.stats ?? {};
}

export async function getTicketAnalytics(tenantSlug: string, days = 30): Promise<TicketAnalytics> {
  const { data } = await api.get<TicketAnalytics>(`api/v1/${tenantSlug}/tickets/analytics`, {
    params: { days },
  });
  return data;
}

// Categories. The list is paginated on the API; a tenant's category tree is small, so one page of
// up to 100 covers it.

export async function getCategories(tenantSlug: string): Promise<Category[]> {
  const { data } = await api.get<PageResponse<Category>>(`api/v1/${tenantSlug}/categories`, {
    params: { limit: 100 },
  });
  return data.data ?? [];
}

export async function createCategory(tenantSlug: string, payload: CreateCategoryData): Promise<Category> {
  const { data } = await api.post<Category>(`api/v1/${tenantSlug}/categories`, payload);
  return data;
}

export async function updateCategory(tenantSlug: string, id: string, payload: UpdateCategoryData): Promise<void> {
  await api.put(`api/v1/${tenantSlug}/categories/${id}`, payload);
}

export async function deleteCategory(tenantSlug: string, id: string): Promise<void> {
  await api.delete(`api/v1/${tenantSlug}/categories/${id}`);
}

// Opening, reading and replying to a ticket from the public pages live in ./public-support.ts.
