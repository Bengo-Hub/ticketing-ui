// Mirrors ticketing-api internal/modules/identity/domain.go. Field names are the wire names.
import type { PageResponse } from "@/types/tickets";

export type AgentRole = "agent" | "supervisor" | "admin";
export type AgentStatus = "available" | "busy" | "away" | "offline";

export interface Agent {
  id: string;
  tenant_id: string;
  user_id: string;
  team_id?: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  role: AgentRole;
  status: AgentStatus;
  max_concurrent_tickets: number;
  current_ticket_count: number;
  skills?: string[];
  metadata?: Record<string, unknown>;
  is_active: boolean;
  last_active_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  metadata?: Record<string, unknown>;
  agent_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateAgentData {
  user_id: string;
  email: string;
  display_name: string;
  team_id?: string;
  role?: AgentRole;
  max_concurrent_tickets?: number;
  skills?: string[];
}

export interface UpdateAgentData {
  team_id?: string;
  display_name?: string;
  role?: AgentRole;
  status?: AgentStatus;
  max_concurrent_tickets?: number;
  skills?: string[];
  is_active?: boolean;
}

export interface CreateTeamData {
  name: string;
  description?: string;
}

export interface UpdateTeamData {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export type AgentListResponse = PageResponse<Agent>;
export type TeamListResponse = PageResponse<Team>;
