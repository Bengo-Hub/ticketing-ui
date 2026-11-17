import { api } from "@/lib/api-client";
import type {
  BusinessCalendar,
  CalendarInput,
  CalendarListResponse,
  CreateSLAPolicyData,
  SLAPolicy,
  SLAPolicyListParams,
  SLAPolicyListResponse,
  SLAReport,
  SLAReportParams,
  UpdateSLAPolicyData,
} from "@/types/sla";

export async function getSLAPolicies(params: SLAPolicyListParams): Promise<SLAPolicyListResponse> {
  const { tenantSlug, ...rest } = params;
  const { data } = await api.get<SLAPolicyListResponse>(`api/v1/${tenantSlug}/sla/policies`, { params: rest });
  return data;
}

export async function getSLAPolicy(tenantSlug: string, id: string): Promise<SLAPolicy> {
  const { data } = await api.get<SLAPolicy>(`api/v1/${tenantSlug}/sla/policies/${id}`);
  return data;
}

export async function createSLAPolicy(tenantSlug: string, payload: CreateSLAPolicyData): Promise<SLAPolicy> {
  const { data } = await api.post<SLAPolicy>(`api/v1/${tenantSlug}/sla/policies`, payload);
  return data;
}

export async function updateSLAPolicy(tenantSlug: string, id: string, payload: UpdateSLAPolicyData): Promise<void> {
  await api.put(`api/v1/${tenantSlug}/sla/policies/${id}`, payload);
}

export async function deleteSLAPolicy(tenantSlug: string, id: string): Promise<void> {
  await api.delete(`api/v1/${tenantSlug}/sla/policies/${id}`);
}

export async function getCalendars(
  tenantSlug: string,
  params: { page?: number; limit?: number },
): Promise<CalendarListResponse> {
  const { data } = await api.get<CalendarListResponse>(`api/v1/${tenantSlug}/sla/calendars`, { params });
  return data;
}

export async function createCalendar(tenantSlug: string, payload: CalendarInput): Promise<BusinessCalendar> {
  const { data } = await api.post<BusinessCalendar>(`api/v1/${tenantSlug}/sla/calendars`, payload);
  return data;
}

export async function updateCalendar(tenantSlug: string, id: string, payload: CalendarInput): Promise<BusinessCalendar> {
  const { data } = await api.put<BusinessCalendar>(`api/v1/${tenantSlug}/sla/calendars/${id}`, payload);
  return data;
}

/** Answers 409 while a policy still uses the calendar. */
export async function deleteCalendar(tenantSlug: string, id: string): Promise<void> {
  await api.delete(`api/v1/${tenantSlug}/sla/calendars/${id}`);
}

export async function getSLAReport(tenantSlug: string, params: SLAReportParams): Promise<SLAReport> {
  const { data } = await api.get<SLAReport>(`api/v1/${tenantSlug}/sla/reports`, { params });
  return data;
}
