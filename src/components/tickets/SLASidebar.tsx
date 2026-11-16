"use client";

import type { ReactNode } from "react";
import { CalendarClock, CheckCircle2, CirclePause, ShieldAlert } from "lucide-react";
import { Separator } from "@/components/ui/base";
import { SLATimer } from "./SLATimer";
import { useCalendar, useSLAPolicy } from "@/hooks/useSLA";
import { useServicePermissions } from "@/hooks/useServicePermissions";
import { useT } from "@/hooks/useT";
import { PERM } from "@/lib/rbac/permissions";
import { formatMinutes, readSettings } from "@/lib/sla";
import { formatDateTime } from "@/lib/utils";
import type { Ticket } from "@/types/tickets";

function Met({ label, at, took }: { label: string; at: string; took?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
      <CheckCircle2 className="h-3.5 w-3.5" />
      <span className="font-semibold">{label}</span>
      <span className="text-muted-foreground">{formatDateTime(at)}</span>
      {took && <span className="w-full pl-5 text-muted-foreground">{took}</span>}
    </div>
  );
}

function Target({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

/**
 * The ticket's SLA deadlines, whether the clock is paused, and which clock the policy counts in.
 * The ticket carries only its policy id, so the clock line and the warning colour appear for
 * people who may read SLA settings; everyone else sees the deadlines alone.
 */
export function SLASidebar({ ticket, orgSlug }: { ticket: Ticket; orgSlug: string }) {
  const { t } = useT();
  const { can } = useServicePermissions(orgSlug);
  const canRead = can(PERM.slaView);
  const policy = useSLAPolicy(orgSlug, ticket.sla_policy_id, canRead).data;
  const calendar = useCalendar(orgSlug, policy?.calendar_id, canRead).data;
  const hasSLA = ticket.sla_response_due_at || ticket.sla_resolution_due_at;
  if (!hasSLA) return null;

  const paused = !!ticket.sla_paused_at;
  const warnMinutes = policy ? readSettings(policy.metadata).notifyBeforeBreachMin : undefined;
  const pausedMinutes = ticket.sla_paused_minutes ?? 0;
  const took = (m?: number) => (m != null ? t("sla.tookBusiness", { duration: formatMinutes(m, t) }) : undefined);

  let clockLine: string | null = null;
  if (policy && !policy.calendar_id) clockLine = t("sla.clock24x7");
  else if (calendar) clockLine = t("sla.clockCalendar", { name: calendar.name });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">{t("sla.title")}</span>
      </div>

      <Separator />

      {paused && (
        <div className="flex items-start gap-2 rounded-lg bg-muted px-3 py-2 text-xs">
          <CirclePause className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 space-y-0.5">
            <p className="font-semibold">
              {ticket.status === "pending_internal" ? t("sla.pausedInternal") : t("sla.pausedCustomer")}
            </p>
            <p className="text-muted-foreground">
              {t("sla.pausedSince", { at: formatDateTime(ticket.sla_paused_at as string) })}
            </p>
            <p className="text-muted-foreground">{t("sla.pausedMoves")}</p>
          </div>
        </div>
      )}

      {ticket.sla_response_due_at && (
        <Target title={t("sla.firstResponse")}>
          {ticket.first_response_at ? (
            <Met label={t("sla.responded")} at={ticket.first_response_at} took={took(ticket.sla_first_response_minutes)} />
          ) : (
            <SLATimer
              dueAt={ticket.sla_response_due_at}
              breached={ticket.sla_response_breached}
              paused={paused}
              warnMinutes={warnMinutes}
              label={t("sla.due")}
            />
          )}
        </Target>
      )}

      {ticket.sla_resolution_due_at && (
        <Target title={t("sla.resolution")}>
          {ticket.resolved_at ? (
            <Met label={t("sla.resolved")} at={ticket.resolved_at} took={took(ticket.sla_resolution_minutes)} />
          ) : (
            <SLATimer
              dueAt={ticket.sla_resolution_due_at}
              breached={ticket.sla_resolution_breached}
              paused={paused}
              warnMinutes={warnMinutes}
              label={t("sla.due")}
            />
          )}
        </Target>
      )}

      {(clockLine || pausedMinutes > 0) && (
        <div className="space-y-1 text-xs text-muted-foreground">
          {clockLine && (
            <p className="flex items-start gap-1.5">
              <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0">{clockLine}</span>
            </p>
          )}
          {pausedMinutes > 0 && <p>{t("sla.pausedTotal", { duration: formatMinutes(pausedMinutes, t) })}</p>}
        </div>
      )}
    </div>
  );
}
