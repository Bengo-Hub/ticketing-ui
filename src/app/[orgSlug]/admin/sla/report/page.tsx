"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AlertCircle, ChartNoAxesColumn, CircleCheck, Hourglass, MessageSquareReply, Ticket, Timer } from "lucide-react";
import { DataTable } from "@bengo-hub/shared-ui-lib/data-table";
import { SearchableCombobox } from "@bengo-hub/shared-ui-lib/combobox";
import { PageHeader } from "@/components/common/page-header";
import { KpiCard } from "@/components/common/kpi-card";
import { Field } from "@/components/common/field";
import { Input } from "@/components/ui/base";
import { PriorityBadge } from "@/components/tickets/PriorityBadge";
import { useLookups } from "@/hooks/useLookups";
import { useSLAReport } from "@/hooks/useSLA";
import { useT } from "@/hooks/useT";
import type { Translate } from "@/lib/i18n";
import { formatMinutes, isoDate, MAX_REPORT_DAYS, todayISO } from "@/lib/sla";
import { currentTicketLabels, useTicketLabels } from "@/lib/ticket-options";
import { orgRoute } from "@/lib/utils";
import type { PriorityStats, SLAReportParams, TargetStats, TeamStats } from "@/types/sla";
import type { TicketPriority } from "@/types/tickets";
import { SLATabs } from "../sla-tabs";
import { buildReportColumns, formatPct } from "./report-columns";

const DAY_MS = 86_400_000;

/** Local midnight of a YYYY-MM-DD date, moved by a number of days. */
function localMidnight(date: string, addDays = 0): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d + addDays);
}

function shiftISO(date: string, days: number): string {
  return isoDate(localMidnight(date, days));
}

function countsLine(s: TargetStats | undefined, t: Translate): string | undefined {
  return s ? t("slaReport.metBreached", { met: s.met, breached: s.breached }) : undefined;
}

export default function SLAReportPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const { t } = useT();
  const labels = useTicketLabels();
  const { teamOptions, agentOptions, teamName } = useLookups(orgSlug);

  const [from, setFrom] = useState(() => shiftISO(todayISO(), -29));
  const [to, setTo] = useState(todayISO);
  const [teamId, setTeamId] = useState("");
  const [agentId, setAgentId] = useState("");
  const [priority, setPriority] = useState<TicketPriority | "">("");

  // The API window is [from, to); the end date the person picks is included, so it sends the next
  // local midnight.
  const days = from && to ? Math.round((localMidnight(to, 1).getTime() - localMidnight(from).getTime()) / DAY_MS) : 0;
  const rangeError = !from || !to || days < 1 ? t("slaReport.rangeInvalid") : days > MAX_REPORT_DAYS ? t("slaReport.rangeTooLong", { n: MAX_REPORT_DAYS }) : null;
  const query: SLAReportParams = useMemo(
    () =>
      rangeError
        ? {}
        : {
            from: localMidnight(from).toISOString(),
            to: localMidnight(to, 1).toISOString(),
            team_id: teamId || undefined,
            agent_id: agentId || undefined,
            priority: priority || undefined,
          },
    [rangeError, from, to, teamId, agentId, priority],
  );
  const { data, isLoading, isError, refetch } = useSLAReport(orgSlug, query, !rangeError);
  const overall = data?.overall;
  const loading = isLoading && !rangeError;

  const priorityColumns = useMemo(
    () =>
      buildReportColumns<PriorityStats>(t, {
        key: "priority",
        header: t("slaReport.colPriority"),
        accessor: (r) => currentTicketLabels().priority(r.priority),
        render: (r) => <PriorityBadge priority={r.priority} />,
      }),
    [t],
  );
  const teamColumns = useMemo(
    () =>
      buildReportColumns<TeamStats>(t, {
        key: "team",
        header: t("slaReport.colTeam"),
        sortable: true,
        accessor: (r) => (r.team_id ? (teamName(r.team_id) ?? t("slaReport.unknownTeam")) : t("slaReport.noTeam")),
      }),
    [t, teamName],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeader
        back={{ href: orgRoute(orgSlug, "/admin"), label: t("nav.admin") }}
        icon={ChartNoAxesColumn}
        title={t("slaReport.title")}
        subtitle={t("slaReport.subtitle")}
      />
      <SLATabs orgSlug={orgSlug} />

      <section aria-label={t("slaReport.filters")} className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5">
        <Field label={t("slaReport.from")} htmlFor="rep-from">
          <Input id="rep-from" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label={t("slaReport.to")} htmlFor="rep-to">
          <Input id="rep-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
        </Field>
        <Field label={t("slaReport.colTeam")}>
          <SearchableCombobox options={teamOptions} value={teamId} onChange={setTeamId} placeholder={t("slaReport.allTeams")} emptyText={t("slaReport.noTeams")} />
        </Field>
        <Field label={t("slaReport.agent")}>
          <SearchableCombobox options={agentOptions} value={agentId} onChange={setAgentId} placeholder={t("slaReport.allAgents")} emptyText={t("slaReport.noAgents")} />
        </Field>
        <Field label={t("slaReport.colPriority")}>
          <SearchableCombobox
            options={labels.priorityOptions}
            value={priority}
            onChange={(v) => setPriority(v as TicketPriority | "")}
            placeholder={t("slaReport.allPriorities")}
          />
        </Field>
        {rangeError && (
          <p className="text-sm text-destructive sm:col-span-2 lg:col-span-5" role="alert">
            {rangeError}
          </p>
        )}
      </section>

      {isError && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="flex-1 text-sm font-medium">{t("slaReport.loadFailed")}</p>
          <button type="button" onClick={() => void refetch()} className="text-sm font-medium underline">
            {t("common.retry")}
          </button>
        </div>
      )}

      <section aria-label={t("slaReport.overall")} className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard icon={Ticket} label={t("slaReport.tickets")} value={overall?.tickets} loading={loading} footnote={t("slaReport.ticketsHint", { n: days })} />
        <KpiCard
          icon={MessageSquareReply}
          label={t("slaReport.frCompliance")}
          display={formatPct(overall?.first_response.compliance_pct)}
          loading={loading}
          footnote={countsLine(overall?.first_response, t)}
        />
        <KpiCard
          icon={CircleCheck}
          label={t("slaReport.resCompliance")}
          display={formatPct(overall?.resolution.compliance_pct)}
          loading={loading}
          footnote={countsLine(overall?.resolution, t)}
        />
        <KpiCard
          icon={Timer}
          label={t("slaReport.frAvg")}
          display={formatMinutes(overall?.first_response.avg_minutes, t)}
          loading={loading}
          footnote={t("slaReport.p90Line", { value: formatMinutes(overall?.first_response.p90_minutes, t) })}
        />
        <KpiCard
          icon={Hourglass}
          label={t("slaReport.resAvg")}
          display={formatMinutes(overall?.resolution.avg_minutes, t)}
          loading={loading}
          footnote={t("slaReport.p90Line", { value: formatMinutes(overall?.resolution.p90_minutes, t) })}
        />
      </section>
      <p className="text-xs text-muted-foreground">{t("slaReport.minutesNote")}</p>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">{t("slaReport.byPriority")}</h2>
        <DataTable
          columns={priorityColumns}
          rows={data?.by_priority ?? []}
          rowKey={(r) => r.priority}
          loading={loading}
          loadingRows={3}
          emptyText={t("slaReport.empty")}
          maxBodyHeight={false}
          exportFileName="sla-report-by-priority"
          showExportCsv
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">{t("slaReport.byTeam")}</h2>
        <DataTable
          columns={teamColumns}
          rows={data?.by_team ?? []}
          rowKey={(r) => r.team_id ?? "none"}
          loading={loading}
          loadingRows={3}
          emptyText={t("slaReport.empty")}
          maxBodyHeight={false}
          exportFileName="sla-report-by-team"
          showExportCsv
        />
      </section>
    </div>
  );
}
