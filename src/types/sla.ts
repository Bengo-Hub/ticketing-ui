// Mirrors ticketing-api internal/modules/sla (domain.go, report.go and clock/). Field names are
// the wire names.
import type { PageResponse, TicketPriority } from "@/types/tickets";

export type SLATarget = "first_response" | "resolution";
export type EscalationWhen = "before_breach" | "after_breach";

/** One step of a policy's escalation ladder (clock.EscalationRule). */
export interface EscalationRule {
  target: SLATarget;
  when: EscalationWhen;
  minutes: number;
  raise_priority?: boolean;
  team_id?: string;
}

/** The SLA keys a policy keeps in its metadata (clock.Settings). */
export interface SLAPolicyMetadata {
  notify_before_breach_min?: number;
  pause_on_pending_internal?: boolean;
  escalation_rules?: EscalationRule[];
  [key: string]: unknown;
}

export interface SLAPolicy {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  priority: TicketPriority;
  category_id?: string;
  /** Null counts every minute (24x7). */
  calendar_id: string | null;
  first_response_minutes: number;
  resolution_minutes: number;
  is_active: boolean;
  sort_order: number;
  metadata?: SLAPolicyMetadata;
  created_at: string;
  updated_at: string;
}

export interface CreateSLAPolicyData {
  name: string;
  description?: string;
  priority: TicketPriority;
  category_id?: string;
  calendar_id?: string;
  first_response_minutes: number;
  resolution_minutes: number;
  sort_order?: number;
  metadata?: SLAPolicyMetadata;
}

export interface UpdateSLAPolicyData {
  name?: string;
  description?: string;
  priority?: TicketPriority;
  category_id?: string;
  calendar_id?: string;
  /** Switches the policy back to 24x7. */
  clear_calendar?: boolean;
  first_response_minutes?: number;
  resolution_minutes?: number;
  is_active?: boolean;
  sort_order?: number;
  /** Replaces the stored metadata as a whole. */
  metadata?: SLAPolicyMetadata;
}

/** Query parameters of GET /{tenant}/sla/policies, named as the API reads them. */
export interface SLAPolicyListParams {
  tenantSlug: string;
  page?: number;
  limit?: number;
  priority?: TicketPriority;
  is_active?: boolean;
}

export type SLAPolicyListResponse = PageResponse<SLAPolicy>;

// Business calendars.

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

/** A working period in local wall time, "08:00" to "17:00". End may be "24:00". */
export interface WorkInterval {
  start: string;
  end: string;
}

/** Working periods per weekday. A missing or empty day is closed. */
export type WeeklyHours = Partial<Record<Weekday, WorkInterval[]>>;

export interface Holiday {
  /** YYYY-MM-DD. */
  date: string;
  name: string;
  /** The date is announced close to the day (Idd ul-Fitr), so the tenant confirms it. */
  moon_dependent?: boolean;
}

export interface BusinessCalendar {
  id: string;
  tenant_id: string;
  name: string;
  timezone: string;
  weekly_hours: WeeklyHours;
  holidays: Holiday[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

/** Body of POST and PUT /sla/calendars. On PUT, omitted fields stay as they are. */
export interface CalendarInput {
  name?: string;
  timezone?: string;
  weekly_hours?: WeeklyHours;
  holidays?: Holiday[];
  is_default?: boolean;
}

export type CalendarListResponse = PageResponse<BusinessCalendar>;

// SLA report.

/** One target's outcome. Null figures mean nothing was measured. */
export interface TargetStats {
  met: number;
  breached: number;
  compliance_pct: number | null;
  avg_minutes: number | null;
  p90_minutes: number | null;
}

export interface ReportStats {
  tickets: number;
  first_response: TargetStats;
  resolution: TargetStats;
}

export interface PriorityStats extends ReportStats {
  priority: TicketPriority;
}

/** A null team_id groups the tickets no team holds. */
export interface TeamStats extends ReportStats {
  team_id: string | null;
}

export interface SLAReport {
  from: string;
  to: string;
  overall: ReportStats;
  by_priority: PriorityStats[];
  by_team: TeamStats[];
}

/** Query parameters of GET /sla/reports. from and to are RFC 3339; to is exclusive. */
export interface SLAReportParams {
  from?: string;
  to?: string;
  team_id?: string;
  agent_id?: string;
  priority?: TicketPriority;
}
