// Agent workspace types. Mirrors ticketing-api internal/modules/tickets (tags.go, views.go,
// macros.go, links.go, bulk.go, presence.go). Field names are the wire names.
import type {
  CommentType,
  Ticket,
  TicketComment,
  TicketPriority,
  TicketSort,
  TicketStatus,
} from '@/types/tickets';

/** GET /{tenant}/tickets/tags: a tag in use and how many tickets carry it. */
export interface TagCount {
  tag: string;
  count: number;
}

/**
 * The filters a saved view stores. The API keeps them as free JSON, so the UI owns this shape.
 * Every key is the list query parameter of the same name.
 */
export interface ViewFilters {
  search?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  channel?: string;
  categoryId?: string;
  agentId?: string;
  teamId?: string;
  tags?: string[];
}

export interface TicketView {
  id: string;
  owner_user_id: string;
  name: string;
  filters: ViewFilters | null;
  sort: TicketSort;
  shared: boolean;
  created_at: string;
  updated_at: string;
}

/** Body of POST /views and PUT /views/{id}. A PUT replaces the whole view. */
export interface ViewInput {
  name: string;
  filters: ViewFilters;
  sort: TicketSort;
  shared: boolean;
}

/** The field changes a macro makes. Every field is optional. */
export interface MacroActions {
  status?: TicketStatus;
  priority?: TicketPriority;
  category_id?: string;
  team_id?: string;
  agent_id?: string;
  add_tags?: string[];
  /** The reply the body becomes: public (the default) or an internal note. */
  comment_type?: Exclude<CommentType, 'system'>;
}

export interface Macro {
  id: string;
  name: string;
  body: string;
  actions: MacroActions;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/** Body of POST /macros and PUT /macros/{id}. A PUT replaces the whole macro. */
export interface MacroInput {
  name: string;
  body: string;
  actions: MacroActions;
  is_active?: boolean;
}

/** POST /tickets/{id}/macros/{macroId}/apply. `comment` is absent when the macro has no body. */
export interface MacroApplied {
  ticket: Ticket;
  comment?: TicketComment;
}

/** How another ticket relates to this one, seen from this ticket. */
export type LinkRelation = 'parent' | 'child' | 'related' | 'duplicate';

export interface LinkedTicket {
  id: string;
  ticket_number: string;
  subject: string;
  status: TicketStatus;
}

/** One entry of GET /tickets/{id}/links. */
export interface TicketLinkView {
  id: string;
  from_ticket_id: string;
  to_ticket_id: string;
  kind: 'parent' | 'related' | 'duplicate';
  created_by: string;
  created_at: string;
  relation: LinkRelation;
  ticket?: LinkedTicket;
}

/** Body of POST /tickets/{id}/links. `kind` is from this ticket's side. */
export interface CreateLinkData {
  ticket_id: string;
  kind: LinkRelation;
}

/** Body of PUT /tickets/bulk. At most 100 ids and at least one change. */
export interface BulkUpdateData {
  ids: string[];
  status?: TicketStatus;
  priority?: TicketPriority;
  agent_id?: string;
  team_id?: string;
  add_tags?: string[];
}

export interface BulkResult {
  id: string;
  ok: boolean;
  error?: string;
}

export interface BulkUpdateResponse {
  results: BulkResult[];
  updated: number;
  failed: number;
}

export type PresenceState = 'viewing' | 'typing';

/** Someone on a ticket. The event form also carries `left` when they close it. */
export interface PresenceEntry {
  user_id: string;
  agent_id?: string | null;
  name: string;
  state: PresenceState;
  expires_at: string;
}

export interface PresenceResponse {
  ticket_id: string;
  data: PresenceEntry[];
}
