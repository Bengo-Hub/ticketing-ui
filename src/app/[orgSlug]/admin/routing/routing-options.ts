import type { ComboboxOption } from "@bengo-hub/shared-ui-lib/combobox";
import type { ActionType, ConditionField, ConditionOperator, RoutingCondition } from "@/types/routing";

export const FIELD_LABEL: Record<ConditionField, string> = {
  priority: "Priority",
  category_id: "Category",
  channel: "Channel",
  subject_contains: "Subject contains",
  description_contains: "Description contains",
};

export const OPERATOR_LABEL: Record<ConditionOperator, string> = {
  eq: "is",
  in: "is any of",
  contains: "contains",
};

export const ACTION_LABEL: Record<ActionType, string> = {
  assign_team: "Assign to team",
  assign_agent: "Assign to agent",
  set_priority: "Set priority",
};

export const FIELD_OPTIONS: ComboboxOption[] = (Object.keys(FIELD_LABEL) as ConditionField[]).map((v) => ({
  value: v,
  label: FIELD_LABEL[v],
}));

export const ACTION_OPTIONS: ComboboxOption[] = (Object.keys(ACTION_LABEL) as ActionType[]).map((v) => ({
  value: v,
  label: ACTION_LABEL[v],
}));

/** Text fields match by "contains"; the list fields match one value or any of several. */
export function operatorsFor(field: ConditionField): ConditionOperator[] {
  return field === "subject_contains" || field === "description_contains" ? ["contains"] : ["eq", "in"];
}

export function blankCondition(field: ConditionField = "priority"): RoutingCondition {
  const op = operatorsFor(field)[0];
  return { field, operator: op, value: op === "in" ? [] : "" };
}

export function conditionIsComplete(c: RoutingCondition): boolean {
  return Array.isArray(c.value) ? c.value.length > 0 : c.value.trim() !== "";
}
