// Mirrors ticketing-api internal/modules/routing/domain.go. Field names are the wire names.
import type { PageResponse } from "@/types/tickets";

export type ConditionField = "priority" | "category_id" | "channel" | "subject_contains" | "description_contains";
export type ConditionOperator = "eq" | "in" | "contains";
export type ActionType = "assign_team" | "assign_agent" | "set_priority";

export interface RoutingCondition {
  field: ConditionField;
  operator: ConditionOperator;
  /** A string for eq and contains, a list of strings for in. */
  value: string | string[];
}

export interface RoutingAction {
  type: ActionType;
  /** Team or agent id, or a priority. */
  value: string;
}

export interface RoutingRule {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  conditions: RoutingCondition[];
  action: RoutingAction;
  created_at: string;
  updated_at: string;
}

export interface CreateRoutingRuleData {
  name: string;
  description?: string;
  is_active: boolean;
  sort_order?: number;
  conditions: RoutingCondition[];
  action: RoutingAction;
}

export interface UpdateRoutingRuleData {
  name?: string;
  description?: string;
  is_active?: boolean;
  sort_order?: number;
  conditions?: RoutingCondition[];
  action?: RoutingAction;
}

export type RoutingRuleListResponse = PageResponse<RoutingRule>;
