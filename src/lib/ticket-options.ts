import type { ComboboxOption } from "@bengo-hub/shared-ui-lib/combobox";
import type { TicketChannel, TicketPriority, TicketStatus } from "@/types/tickets";

export const STATUS_LABEL: Record<TicketStatus, string> = {
  new: "New",
  open: "Open",
  in_progress: "In progress",
  pending_customer: "Pending customer",
  pending_internal: "Pending internal",
  resolved: "Resolved",
  closed: "Closed",
  cancelled: "Cancelled",
};

export const PRIORITY_LABEL: Record<TicketPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
  critical: "Critical",
};

export const CHANNEL_LABEL: Record<TicketChannel, string> = {
  web: "Web",
  email: "Email",
  api: "API",
  chat: "Chat",
  whatsapp: "WhatsApp",
  phone: "Phone",
  internal: "Internal",
};

function options<K extends string>(labels: Record<K, string>): ComboboxOption[] {
  return (Object.keys(labels) as K[]).map((value) => ({ value, label: labels[value] }));
}

export const STATUS_OPTIONS = options(STATUS_LABEL);
export const PRIORITY_OPTIONS = options(PRIORITY_LABEL);
export const CHANNEL_OPTIONS = options(CHANNEL_LABEL);

/** Mirrors ticketing-api tickets.validTransitions: the statuses each status may move to. */
export const STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  new: ["open", "in_progress", "cancelled"],
  open: ["in_progress", "pending_customer", "pending_internal", "resolved", "closed", "cancelled"],
  in_progress: ["open", "pending_customer", "pending_internal", "resolved", "closed", "cancelled"],
  pending_customer: ["open", "in_progress", "resolved", "closed", "cancelled"],
  pending_internal: ["open", "in_progress", "resolved", "closed", "cancelled"],
  resolved: ["open", "closed"],
  closed: ["open"],
  cancelled: [],
};

/** The current status plus the ones the API accepts from it. */
export function statusOptionsFrom(current: TicketStatus): ComboboxOption[] {
  return [current, ...STATUS_TRANSITIONS[current]].map((s) => ({ value: s, label: STATUS_LABEL[s] }));
}
