"use client";

import { CheckCircle2, ShieldAlert } from "lucide-react";
import { Separator } from "@/components/ui/base";
import { SLATimer } from "./SLATimer";
import { useT } from "@/hooks/useT";
import { formatDateTime } from "@/lib/utils";
import type { Ticket } from "@/types/tickets";

interface SLASidebarProps {
  ticket: Ticket;
}

/**
 * The ticket's SLA deadlines. The ticket carries no SLA policy, so the panel makes no claim about
 * business hours; once the API returns the policy with the ticket it can say whether they apply.
 */
export function SLASidebar({ ticket }: SLASidebarProps) {
  const { t } = useT();
  const hasSLA = ticket.sla_response_due_at || ticket.sla_resolution_due_at;
  if (!hasSLA) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">{t("sla.title")}</span>
      </div>

      <Separator />

      {ticket.sla_response_due_at && (
        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{t("sla.firstResponse")}</p>
          {ticket.first_response_at ? (
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="font-semibold">{t("sla.responded")}</span>
              <span className="text-muted-foreground">{formatDateTime(ticket.first_response_at)}</span>
            </div>
          ) : (
            <SLATimer dueAt={ticket.sla_response_due_at} breached={ticket.sla_response_breached} label={t("sla.due")} />
          )}
        </div>
      )}

      {ticket.sla_resolution_due_at && (
        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{t("sla.resolution")}</p>
          {ticket.resolved_at ? (
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="font-semibold">{t("sla.resolved")}</span>
              <span className="text-muted-foreground">{formatDateTime(ticket.resolved_at)}</span>
            </div>
          ) : (
            <SLATimer dueAt={ticket.sla_resolution_due_at} breached={ticket.sla_resolution_breached} label={t("sla.due")} />
          )}
        </div>
      )}
    </div>
  );
}
