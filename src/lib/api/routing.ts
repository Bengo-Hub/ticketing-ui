import { api } from "@/lib/api-client";
import type {
  CreateRoutingRuleData,
  RoutingRule,
  RoutingRuleListResponse,
  UpdateRoutingRuleData,
} from "@/types/routing";

export async function getRoutingRules(
  tenantSlug: string,
  params: { page?: number; limit?: number } = {},
): Promise<RoutingRuleListResponse> {
  const { data } = await api.get<RoutingRuleListResponse>(`api/v1/${tenantSlug}/routing/rules`, { params });
  return data;
}

export async function createRoutingRule(tenantSlug: string, payload: CreateRoutingRuleData): Promise<RoutingRule> {
  const { data } = await api.post<RoutingRule>(`api/v1/${tenantSlug}/routing/rules`, payload);
  return data;
}

export async function updateRoutingRule(tenantSlug: string, id: string, payload: UpdateRoutingRuleData): Promise<void> {
  await api.put(`api/v1/${tenantSlug}/routing/rules/${id}`, payload);
}

export async function deleteRoutingRule(tenantSlug: string, id: string): Promise<void> {
  await api.delete(`api/v1/${tenantSlug}/routing/rules/${id}`);
}
