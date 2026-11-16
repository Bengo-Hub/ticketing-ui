// Mirrors ticketing-api internal/modules/tickets/domain.go. Field names are the wire names.

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

export type TicketChannel = 'web' | 'email' | 'api' | 'chat' | 'whatsapp' | 'phone' | 'internal';

export type CommentType = 'public' | 'internal' | 'system';
export type AuthorType = 'customer' | 'agent' | 'system';

export interface Ticket {
  id: string;
  tenant_id: string;
  ticket_number: string;
  customer_id: string;
  category_id?: string;
  assigned_agent_id?: string;
  assigned_team_id?: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  channel: TicketChannel;
  order_id?: string;
  external_reference?: string;
  crm_contact_id?: string;
  crm_lead_id?: string;
  sla_response_due_at?: string;
  sla_resolution_due_at?: string;
  sla_response_breached: boolean;
  sla_resolution_breached: boolean;
  first_response_at?: string;
  resolved_at?: string;
  closed_at?: string;
  reopened_at?: string;
  escalation_level: number;
  escalated_at?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TicketComment {
  id: string;
  tenant_id: string;
  ticket_id: string;
  author_id: string;
  author_type: AuthorType;
  comment_type: CommentType;
  content: string;
  /** Agent ids the comment @mentions (staff comments only). */
  mentions?: string[];
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/** A file on a ticket. The file itself is fetched through a short-lived signed link. */
export interface TicketAttachment {
  id: string;
  tenant_id: string;
  ticket_id: string;
  comment_id?: string;
  filename: string;
  content_type: string;
  size: number;
  uploaded_by_id: string;
  /** Internal files belong to staff and are never shown to the customer. */
  internal: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
}

/** GET .../attachments/{id}/download. The link works for five minutes. */
export interface AttachmentLink {
  url: string;
  filename: string;
  expires_at: string;
}

/**
 * GET /{tenant}/tickets/stats answers `{ "stats": { "<status>": count } }`, all-time counts per
 * status. Statuses with no tickets may be absent.
 */
export type TicketStats = Partial<Record<TicketStatus, number>>;

export interface Category {
  id: string;
  tenant_id: string;
  parent_id?: string;
  name: string;
  description?: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  parent_id?: string;
  icon?: string;
  sort_order?: number;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  parent_id?: string;
  icon?: string;
  sort_order?: number;
  is_active?: boolean;
}

/** The two orders of the ticket list. Both page by creation time. */
export type TicketSort = 'created_desc' | 'created_asc';

/**
 * Filters of GET /{tenant}/tickets, named as the API reads them. `tags` is a comma list the API
 * reads as "carries every one of these". The cursor is not part of the filters: the infinite
 * query adds it page by page.
 */
export interface TicketListFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  channel?: TicketChannel;
  customerId?: string;
  agentId?: string;
  teamId?: string;
  categoryId?: string;
  orderId?: string;
  tags?: string;
  sort?: TicketSort;
  limit?: number;
}

export interface TicketListParams extends TicketListFilters {
  tenantSlug: string;
  search?: string;
  cursor?: string;
}

/** Offset pagination response (github.com/Bengo-Hub/pagination Response), still used by the directory lists. */
export interface PageResponse<T> {
  data: T[];
  total: number;
  limit: number;
  page: number;
  hasMore: boolean;
}

/**
 * One keyset page (ticketing-api keyset.go). Ask for the next page with `cursor=next_cursor`
 * while `has_more` is true. There is no total.
 */
export interface CursorPage<T> {
  data: T[];
  next_cursor?: string;
  has_more: boolean;
}

export type TicketListResponse = CursorPage<Ticket>;

export interface CreateTicketData {
  subject: string;
  description: string;
  priority?: TicketPriority;
  channel?: TicketChannel;
  category_id?: string;
  order_id?: string;
  tags?: string[];
  requester_name?: string;
  requester_email?: string;
  requester_phone?: string;
}

export interface UpdateTicketData {
  subject?: string;
  priority?: TicketPriority;
  category_id?: string;
  assigned_agent_id?: string;
  assigned_team_id?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
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
