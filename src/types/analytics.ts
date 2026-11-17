// The analytics routes of ticketing-api, as written in ticketing-api docs/analytics.md. Period
// figures come from the hourly and daily rollup; `stats`, `open` and `overdue` are live counts.

import type { TicketChannel, TicketPriority } from "@/types/tickets";

export type AnalyticsView = "tickets" | "agents" | "sla" | "csat";
export type AnalyticsInterval = "hour" | "day" | "week" | "month";
export type ExportFormat = "pdf" | "csv" | "xlsx";

/** The query every analytics route and its export take. Empty values are left out. */
export interface AnalyticsParams {
  /** YYYY-MM-DD in `tz`; a date as `to` includes that whole day. */
  from?: string;
  to?: string;
  tz?: string;
  interval?: AnalyticsInterval;
  team_id?: string;
  agent_id?: string;
  category_id?: string;
  channel?: TicketChannel;
  priority?: TicketPriority;
}

export interface AnalyticsPeriod {
  from: string;
  to: string;
  previous_from: string;
  previous_to: string;
  tz: string;
  interval: AnalyticsInterval;
  source: "hour" | "day";
  rollups_as_of: string | null;
  backfill_complete: boolean;
}

export interface AnalyticsFilters {
  team_id: string | null;
  agent_id: string | null;
  category_id: string | null;
  channel: string | null;
  priority: string | null;
}

export interface TargetFigures {
  met: number;
  breached: number;
  compliance_pct: number | null;
}

export type CsatScore = "1" | "2" | "3" | "4" | "5";

export interface CsatFigures {
  responses: number;
  average: number | null;
  satisfied_pct: number | null;
  scores: Record<CsatScore, number>;
}

export interface AnalyticsMetrics {
  created: number;
  resolved: number;
  first_responses: number;
  avg_first_response_minutes: number | null;
  avg_resolution_minutes: number | null;
  first_response_sla: TargetFigures;
  resolution_sla: TargetFigures;
  csat: CsatFigures;
}

/** `*_pct` is a relative change in percent; `*_delta` a plain difference. Null: nothing to compare. */
export interface AnalyticsChange {
  created_pct: number | null;
  resolved_pct: number | null;
  avg_first_response_pct: number | null;
  avg_resolution_pct: number | null;
  first_response_compliance_delta: number | null;
  resolution_compliance_delta: number | null;
  csat_responses_pct: number | null;
  csat_average_delta: number | null;
  csat_satisfied_delta: number | null;
}

/** One trend bucket; `bucket` is its start in the period's time zone. Empty buckets count zero. */
export interface TrendPoint extends AnalyticsMetrics {
  bucket: string;
}

/**
 * A breakdown row. `key` is the team, agent or category id, the channel or the priority; the empty
 * key is the tickets with no team, agent or category. `email` is set on agent rows only.
 */
export interface AnalyticsGroup extends AnalyticsMetrics {
  key: string;
  name: string;
  email?: string;
}

export interface LiveTicketStats {
  open: number;
  by_status: Partial<Record<"new" | "open" | "in_progress" | "pending_customer" | "pending_internal", number>>;
  overdue: number;
  unassigned: number;
  created_today: number;
  resolved_today: number;
  today_start: string;
}

interface AnalyticsBase {
  period: AnalyticsPeriod;
  filters: AnalyticsFilters;
}

export interface TicketsAnalytics extends AnalyticsBase {
  stats: LiveTicketStats;
  current: AnalyticsMetrics;
  previous: AnalyticsMetrics;
  change: AnalyticsChange;
  trend: TrendPoint[];
  by_priority: AnalyticsGroup[];
  by_channel: AnalyticsGroup[];
  by_category: AnalyticsGroup[];
  by_team: AnalyticsGroup[];
}

/** One leaderboard row. `agent_id` null is the unassigned tickets; `open` is live. */
export interface AgentRow extends AnalyticsMetrics {
  agent_id: string | null;
  name: string;
  email: string;
  open: number;
  previous_resolved: number;
  resolved_change_pct: number | null;
}

export interface AgentsAnalytics extends AnalyticsBase {
  agents: AgentRow[];
}

export interface SLAAnalytics extends AnalyticsBase {
  overdue: number;
  current: AnalyticsMetrics;
  previous: AnalyticsMetrics;
  change: AnalyticsChange;
  trend: TrendPoint[];
  by_priority: AnalyticsGroup[];
  by_team: AnalyticsGroup[];
  by_agent: AnalyticsGroup[];
}

export interface CsatComment {
  ticket_id: string;
  ticket_number: string;
  score: number;
  comment: string;
  submitted_at: string;
}

export interface CsatAnalytics extends AnalyticsBase {
  current: CsatFigures;
  previous: CsatFigures;
  change: AnalyticsChange;
  trend: TrendPoint[];
  by_agent: AnalyticsGroup[];
  by_team: AnalyticsGroup[];
  by_channel: AnalyticsGroup[];
  recent_comments: CsatComment[];
}

export interface AnalyticsByView {
  tickets: TicketsAnalytics;
  agents: AgentsAnalytics;
  sla: SLAAnalytics;
  csat: CsatAnalytics;
}
