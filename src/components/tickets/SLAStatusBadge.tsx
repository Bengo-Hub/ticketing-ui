"use client";

import { AlertTriangle, CheckCircle, CirclePause, Clock, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/hooks/useT";
import type { MessageKey } from "@/lib/i18n";
import type { Ticket } from "@/types/tickets";

type SLAState = "on_track" | "paused" | "overdue" | "breached_response" | "breached_resolution";

/**
 * The SLA state the ticket's own fields support. Only targets not yet met count. A deadline that
 * has passed before the worker flags the breach reads "overdue". A paused clock reads "paused",
 * because its deadlines move when it restarts.
 */
function getSLAState(ticket: Ticket): SLAState | null {
  if (!ticket.sla_response_due_at && !ticket.sla_resolution_due_at) return null;
  if (ticket.sla_resolution_breached) return "breached_resolution";
  if (ticket.sla_response_breached) return "breached_response";

  const open: string[] = [];
  if (ticket.sla_response_due_at && !ticket.first_response_at) open.push(ticket.sla_response_due_at);
  if (ticket.sla_resolution_due_at && !ticket.resolved_at) open.push(ticket.sla_resolution_due_at);
  if (open.length === 0) return null;
  if (ticket.sla_paused_at) return "paused";

  const nearest = Math.min(...open.map((d) => new Date(d).getTime()));
  return nearest <= Date.now() ? "overdue" : "on_track";
}

const CONFIG: Record<SLAState, { label: MessageKey; icon: React.ElementType; className: string }> = {
  on_track: {
    label: "sla.onTrack",
    icon: CheckCircle,
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  paused: {
    label: "sla.pausedBadge",
    icon: CirclePause,
    className: "bg-muted text-muted-foreground",
  },
  overdue: {
    label: "sla.overdue",
    icon: Clock,
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  breached_response: {
    label: "sla.responseBreached",
    icon: AlertTriangle,
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  breached_resolution: {
    label: "sla.slaBreached",
    icon: ShieldAlert,
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};

interface SLAStatusBadgeProps {
  ticket: Ticket;
  className?: string;
}

export function SLAStatusBadge({ ticket, className }: SLAStatusBadgeProps) {
  const { t } = useT();
  const state = getSLAState(ticket);
  if (!state) return null;

  const { label, icon: Icon, className: colourClass } = CONFIG[state];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        colourClass,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {t(label)}
    </span>
  );
}
