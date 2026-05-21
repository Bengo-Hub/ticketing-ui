export interface Agent {
  id: string;
  tenant_id: string;
  user_id: string;
  email: string;
  full_name: string;
  team_id?: string;
  role: 'agent' | 'supervisor' | 'admin';
  status: 'active' | 'inactive' | 'busy';
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  lead_agent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAgentData {
  user_id: string;
  email: string;
  full_name: string;
  team_id?: string;
  role?: Agent['role'];
}

export interface CreateTeamData {
  name: string;
  description?: string;
  lead_agent_id?: string;
}

export interface AgentListResponse {
  data: Agent[];
  total: number;
  page: number;
  page_size: number;
}

export interface TeamListResponse {
  data: Team[];
  total: number;
  page: number;
  page_size: number;
}
