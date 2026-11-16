import { useMemo } from "react";
import type { ComboboxOption } from "@bengo-hub/shared-ui-lib/combobox";
import { useT } from "@/hooks/useT";
import { getLocale, translate, type Translate } from "@/lib/i18n";
import type { TicketChannel, TicketPriority, TicketStatus } from "@/types/tickets";

export const TICKET_STATUSES: readonly TicketStatus[] = [
  "new",
  "open",
  "in_progress",
  "pending_customer",
  "pending_internal",
  "resolved",
  "closed",
  "cancelled",
];

export const TICKET_PRIORITIES: readonly TicketPriority[] = ["low", "normal", "high", "urgent", "critical"];

export const TICKET_CHANNELS: readonly TicketChannel[] = ["web", "email", "api", "chat", "whatsapp", "phone", "internal"];

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

/** Labels and picker options for statuses, priorities and channels in one language. */
export interface TicketLabels {
  /** Unknown values from the API come back as sent. */
  status: (s: string) => string;
  priority: (p: string) => string;
  channel: (c: string) => string;
  statusOptions: ComboboxOption[];
  priorityOptions: ComboboxOption[];
  channelOptions: ComboboxOption[];
  /** The current status plus the ones the API accepts from it. */
  statusOptionsFrom: (current: TicketStatus) => ComboboxOption[];
}

function has<T extends string>(list: readonly T[], v: string): v is T {
  return (list as readonly string[]).includes(v);
}

export function ticketLabels(t: Translate): TicketLabels {
  const status = (s: string) => (has(TICKET_STATUSES, s) ? t(`ticketStatus.${s}`) : s);
  const priority = (p: string) => (has(TICKET_PRIORITIES, p) ? t(`ticketPriority.${p}`) : p);
  const channel = (c: string) => (has(TICKET_CHANNELS, c) ? t(`ticketChannel.${c}`) : c);
  return {
    status,
    priority,
    channel,
    statusOptions: TICKET_STATUSES.map((value) => ({ value, label: status(value) })),
    priorityOptions: TICKET_PRIORITIES.map((value) => ({ value, label: priority(value) })),
    channelOptions: TICKET_CHANNELS.map((value) => ({ value, label: channel(value) })),
    statusOptionsFrom: (current) =>
      [current, ...STATUS_TRANSITIONS[current]].map((value) => ({ value, label: status(value) })),
  };
}

/**
 * Labels in the language active right now, for plain helpers such as column builders. Components
 * use useTicketLabels so they re-render when the language changes.
 */
export function currentTicketLabels(): TicketLabels {
  const locale = getLocale();
  return ticketLabels((key, vars) => translate(locale, key, vars));
}

/** Ticket labels in the active language, rebuilt when the language changes. */
export function useTicketLabels(): TicketLabels {
  const { t } = useT();
  return useMemo(() => ticketLabels(t), [t]);
}
