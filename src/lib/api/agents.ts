import { api } from "@/lib/api-client";
import type {
  Agent,
  AgentListResponse,
  CreateAgentData,
  CreateTeamData,
  Team,
  TeamListResponse,
  UpdateAgentData,
  UpdateTeamData,
} from "@/types/agents";

/** Query parameters GET /{tenant}/agents and /teams read. The API caps `limit` at 100. */
export interface DirectoryListParams {
  page?: number;
  limit?: number;
  teamId?: string;
  status?: string;
  role?: string;
  active?: boolean;
}

export async function getAgents(tenantSlug: string, params: DirectoryListParams = {}): Promise<AgentListResponse> {
  const { data } = await api.get<AgentListResponse>(`api/v1/${tenantSlug}/agents`, { params });
  return data;
}

/** Agents available for assignment, least loaded first (at most 200). */
export async function getAvailableAgents(tenantSlug: string, teamId?: string): Promise<Agent[]> {
  const { data } = await api.get<{ data?: Agent[] }>(`api/v1/${tenantSlug}/agents/available`, {
    params: { teamId: teamId || undefined, limit: 100 },
  });
  return data.data ?? [];
}

export async function getAgent(tenantSlug: string, id: string): Promise<Agent> {
  const { data } = await api.get<Agent>(`api/v1/${tenantSlug}/agents/${id}`);
  return data;
}

export async function createAgent(tenantSlug: string, payload: CreateAgentData): Promise<Agent> {
  const { data } = await api.post<Agent>(`api/v1/${tenantSlug}/agents`, payload);
  return data;
}

export async function updateAgent(
  tenantSlug: string,
  id: string,
  payload: UpdateAgentData,
): Promise<void> {
  await api.put(`api/v1/${tenantSlug}/agents/${id}`, payload);
}

export async function deleteAgent(tenantSlug: string, id: string): Promise<void> {
  await api.delete(`api/v1/${tenantSlug}/agents/${id}`);
}

export async function getTeams(
  tenantSlug: string,
  params: Pick<DirectoryListParams, "page" | "limit" | "active"> = {},
): Promise<TeamListResponse> {
  const { data } = await api.get<TeamListResponse>(`api/v1/${tenantSlug}/teams`, { params });
  return data;
}

export async function getTeam(tenantSlug: string, id: string): Promise<Team> {
  const { data } = await api.get<Team>(`api/v1/${tenantSlug}/teams/${id}`);
  return data;
}

export async function createTeam(tenantSlug: string, payload: CreateTeamData): Promise<Team> {
  const { data } = await api.post<Team>(`api/v1/${tenantSlug}/teams`, payload);
  return data;
}

export async function updateTeam(
  tenantSlug: string,
  id: string,
  payload: UpdateTeamData,
): Promise<void> {
  await api.put(`api/v1/${tenantSlug}/teams/${id}`, payload);
}

export async function deleteTeam(tenantSlug: string, id: string): Promise<void> {
  await api.delete(`api/v1/${tenantSlug}/teams/${id}`);
}
