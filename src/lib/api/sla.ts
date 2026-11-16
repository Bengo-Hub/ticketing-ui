import { api } from "@/lib/api-client";
import type {
  CreateSLAPolicyData,
  SLAPolicy,
  SLAPolicyListParams,
  SLAPolicyListResponse,
  UpdateSLAPolicyData,
} from "@/types/sla";

export async function getSLAPolicies(params: SLAPolicyListParams): Promise<SLAPolicyListResponse> {
  const { tenantSlug, ...rest } = params;
  const { data } = await api.get<SLAPolicyListResponse>(`api/v1/${tenantSlug}/sla/policies`, { params: rest });
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
