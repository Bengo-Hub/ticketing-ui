import { api } from "@/lib/api-client";
import type {
  AddCommentData,
  Category,
  CreateTicketData,
  Ticket,
  TicketComment,
  TicketListParams,
  TicketListResponse,
  TicketStats,
  TicketStatus,
  UpdateTicketData,
} from "@/types/tickets";

export async function getTickets(params: TicketListParams): Promise<TicketListResponse> {
  const { tenantSlug, ...rest } = params;
  const { data } = await api.get<TicketListResponse>(`api/v1/${tenantSlug}/tickets`, {
    params: rest,
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
): Promise<Ticket> {
  const { data } = await api.patch<Ticket>(`api/v1/${tenantSlug}/tickets/${id}`, payload);
  return data;
}

export async function updateTicketStatus(
  tenantSlug: string,
  id: string,
  status: TicketStatus,
): Promise<Ticket> {
  const { data } = await api.patch<Ticket>(`api/v1/${tenantSlug}/tickets/${id}/status`, {
    status,
  });
  return data;
}

export async function assignTicket(
  tenantSlug: string,
  id: string,
  agentId: string,
): Promise<Ticket> {
  const { data } = await api.patch<Ticket>(`api/v1/${tenantSlug}/tickets/${id}/assign`, {
    agent_id: agentId,
  });
  return data;
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

export async function getTicketComments(
  tenantSlug: string,
  ticketId: string,
): Promise<TicketComment[]> {
  const { data } = await api.get<TicketComment[]>(
    `api/v1/${tenantSlug}/tickets/${ticketId}/comments`,
  );
  return data;
}

export async function getTicketStats(tenantSlug: string): Promise<TicketStats> {
  const { data } = await api.get<TicketStats>(`api/v1/${tenantSlug}/tickets/stats`);
  return data;
}

export async function getCategories(tenantSlug: string): Promise<Category[]> {
  const { data } = await api.get<Category[]>(`api/v1/${tenantSlug}/categories`);
  return data;
}
