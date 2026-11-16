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

export async function getAgents(tenantSlug: string): Promise<AgentListResponse> {
  const { data } = await api.get<AgentListResponse>(`api/v1/${tenantSlug}/agents`);
  return data;
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

export async function getTeams(tenantSlug: string): Promise<TeamListResponse> {
  const { data } = await api.get<TeamListResponse>(`api/v1/${tenantSlug}/teams`);
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
