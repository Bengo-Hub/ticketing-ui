"use client";

import { AlertTriangle, CheckCircle, Clock, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/hooks/useT";
import type { MessageKey } from "@/lib/i18n";
import type { Ticket } from "@/types/tickets";

type SLAState = "on_track" | "at_risk" | "breached_response" | "breached_resolution";

function getSLAState(ticket: Ticket): SLAState | null {
  if (!ticket.sla_response_due_at && !ticket.sla_resolution_due_at) return null;

  if (ticket.sla_resolution_breached) return "breached_resolution";
  if (ticket.sla_response_breached) return "breached_response";

  const now = Date.now();
  const responseDue = ticket.sla_response_due_at ? new Date(ticket.sla_response_due_at).getTime() : null;
  const resolutionDue = ticket.sla_resolution_due_at
    ? new Date(ticket.sla_resolution_due_at).getTime()
    : null;

  const nearestDue = Math.min(
    ...[responseDue, resolutionDue].filter((d): d is number => d !== null),
  );
  const remaining = nearestDue - now;
  const window = 4 * 60 * 60 * 1000; // 4h reference window

  if (remaining <= 0) return "breached_resolution";
  if (remaining / window < 0.1) return "at_risk";
  return "on_track";
}

const CONFIG: Record<SLAState, { label: MessageKey; icon: React.ElementType; className: string }> = {
  on_track: {
    label: "sla.onTrack",
    icon: CheckCircle,
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  at_risk: {
    label: "sla.atRisk",
    icon: Clock,
    className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
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
