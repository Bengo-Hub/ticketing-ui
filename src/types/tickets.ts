export type TicketStatus =
  | 'new'
  | 'open'
  | 'in_progress'
  | 'pending_customer'
  | 'pending_internal'
  | 'resolved'
  | 'closed'
  | 'cancelled';

export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent' | 'critical';

export type TicketChannel = 'web' | 'email' | 'api' | 'chat' | 'phone' | 'internal';

export interface Ticket {
  id: string;
  tenant_id: string;
  ticket_number: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  channel: TicketChannel;
  category_id?: string;
  assigned_agent_id?: string;
  customer_id: string;
  sla_response_due_at?: string;
  sla_resolution_due_at?: string;
  sla_response_breached: boolean;
  sla_resolution_breached: boolean;
  first_response_at?: string;
  external_reference?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  content: string;
  comment_type: 'public' | 'internal' | 'system';
  author_id: string;
  author_type: 'customer' | 'agent' | 'system';
  created_at: string;
  updated_at: string;
}

export interface TicketStats {
  total: number;
  open: number;
  in_progress: number;
  pending: number;
  resolved_today: number;
  overdue: number;
}

export interface Category {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TicketListParams {
  tenantSlug: string;
  page?: number;
  page_size?: number;
  status?: TicketStatus;
  priority?: TicketPriority;
  search?: string;
  assigned_agent_id?: string;
  category_id?: string;
  channel?: TicketChannel;
}

export interface TicketListResponse {
  data: Ticket[];
  total: number;
  page: number;
  page_size: number;
}

export interface CreateTicketData {
  subject: string;
  description: string;
  priority?: TicketPriority;
  channel?: TicketChannel;
  category_id?: string;
}

export interface UpdateTicketData {
  subject?: string;
  description?: string;
  priority?: TicketPriority;
  category_id?: string;
}

export interface AddCommentData {
  content: string;
  comment_type?: 'public' | 'internal';
}

export interface TrendPoint {
  date: string;
  created: number;
  resolved: number;
}

export interface TicketAnalytics {
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  trend: TrendPoint[];
}
