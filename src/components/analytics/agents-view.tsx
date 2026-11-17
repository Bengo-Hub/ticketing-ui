"use client";

import { useMemo } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DataTable, type DataTableColumn } from "@bengo-hub/shared-ui-lib/data-table";
import type { Translate } from "@/lib/i18n";
import { formatCount, formatPct, formatScore } from "@/lib/analytics";
import { formatMinutes } from "@/lib/sla";
import type { AgentRow, AgentsAnalytics } from "@/types/analytics";
import { AXIS_TICK, ChartCard, ChartSkeleton, LEGEND_STYLE, SERIES, TOOLTIP_STYLE } from "./chart-parts";

const CHART_AGENTS = 10;

function ResolvedChange({ pct, t }: { pct: number | null; t: Translate }) {
  if (pct == null) return <span className="text-xs text-muted-foreground">{t("analytics.noPrevious")}</span>;
  const size = Math.round(Math.abs(pct) * 10) / 10;
  const Icon = size === 0 ? ArrowRight : pct > 0 ? ArrowUpRight : ArrowDownRight;
  const text = size === 0 ? t("kpi.level") : t(pct > 0 ? "kpi.up" : "kpi.down", { amount: `${size}%` });
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs">
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {text}
    </span>
  );
}

/** The row's agent, or the unassigned tickets for the row without an agent. */
function agentName(r: AgentRow, t: Translate): string {
  return r.agent_id ? r.name || r.email : t("analytics.unassigned");
}

/** The agent leaderboard: most resolved first, with each agent's live open count, times and CSAT. */
export function AgentsView({ data, loading, t }: { data: AgentsAnalytics | undefined; loading: boolean; t: Translate }) {
  const rows = data?.agents;

  const columns = useMemo<DataTableColumn<AgentRow>[]>(
    () => [
      {
        // The API's order is the ranking; the rank stays with the agent when the table is re-sorted.
        key: "rank",
        header: "#",
        sortable: true,
        mobileHidden: true,
        accessor: (r) => (rows ?? []).indexOf(r) + 1,
        render: (r) => <span className="tabular-nums text-muted-foreground">{(rows ?? []).indexOf(r) + 1}</span>,
      },
      {
        key: "agent",
        header: t("analytics.group.agent"),
        primary: true,
        sortable: true,
        accessor: (r) => agentName(r, t),
        render: (r) => (
          <span className="min-w-0">
            <span className="block truncate font-medium">{agentName(r, t)}</span>
            {r.agent_id && r.email && <span className="block truncate text-xs text-muted-foreground">{r.email}</span>}
          </span>
        ),
      },
      {
        key: "resolved",
        header: t("analytics.colResolved"),
        sortable: true,
        align: "right",
        accessor: (r) => r.resolved,
        render: (r) => (
          <span className="flex flex-col items-end">
            <span className="font-medium tabular-nums">{formatCount(r.resolved)}</span>
            <ResolvedChange pct={r.resolved_change_pct} t={t} />
          </span>
        ),
      },
      {
        key: "open",
        header: t("analytics.colOpenNow"),
        sortable: true,
        align: "right",
        accessor: (r) => r.open,
        render: (r) => <span className="tabular-nums">{formatCount(r.open)}</span>,
      },
      {
        key: "first_responses",
        header: t("analytics.colFirstResponses"),
        sortable: true,
        align: "right",
        hideBelow: "lg",
        accessor: (r) => r.first_responses,
        render: (r) => <span className="tabular-nums">{formatCount(r.first_responses)}</span>,
      },
      {
        key: "avg_first_response",
        header: t("analytics.colAvgFirstResponse"),
        sortable: true,
        align: "right",
        hideBelow: "md",
        accessor: (r) => r.avg_first_response_minutes,
        render: (r) => <span className="whitespace-nowrap tabular-nums">{formatMinutes(r.avg_first_response_minutes, t)}</span>,
      },
      {
        key: "avg_resolution",
        header: t("analytics.colAvgResolution"),
        sortable: true,
        align: "right",
        hideBelow: "md",
        accessor: (r) => r.avg_resolution_minutes,
        render: (r) => <span className="whitespace-nowrap tabular-nums">{formatMinutes(r.avg_resolution_minutes, t)}</span>,
      },
      {
        key: "resolution_sla",
        header: t("analytics.colResolutionMet"),
        sortable: true,
        align: "right",
        hideBelow: "lg",
        accessor: (r) => r.resolution_sla.compliance_pct,
        render: (r) => <span className="tabular-nums">{formatPct(r.resolution_sla.compliance_pct)}</span>,
      },
      {
        key: "csat",
        header: t("analytics.colCsat"),
        sortable: true,
        align: "right",
        hideBelow: "lg",
        accessor: (r) => r.csat.average,
        render: (r) => (
          <span className="whitespace-nowrap tabular-nums">
            {formatScore(r.csat.average)}
            {r.csat.responses > 0 && <span className="text-xs text-muted-foreground"> ({r.csat.responses})</span>}
          </span>
        ),
      },
    ],
    [rows, t],
  );

  const chart = (rows ?? [])
    .filter((r) => r.agent_id)
    .slice(0, CHART_AGENTS)
    .map((r) => ({ name: agentName(r, t), resolved: r.resolved, open: r.open }));

  return (
    <div className="space-y-5">
      <ChartCard title={t("analytics.topAgents", { n: CHART_AGENTS })}>
        {loading && !data ? (
          <ChartSkeleton height={280} />
        ) : chart.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">{t("analytics.emptyGroup")}</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(160, chart.length * 34 + 40)}>
            <BarChart data={chart} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={AXIS_TICK} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={AXIS_TICK} width={96} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--muted)" }} />
              <Legend wrapperStyle={LEGEND_STYLE} />
              <Bar dataKey="resolved" name={t("analytics.resolved")} fill={SERIES.resolved} radius={[0, 4, 4, 0]} />
              <Bar dataKey="open" name={t("analytics.colOpenNow")} fill={SERIES.created} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title={t("analytics.leaderboard")} description={t("analytics.leaderboardHint")}>
        <DataTable
          columns={columns}
          rows={rows ?? []}
          rowKey={(r) => r.agent_id ?? "unassigned"}
          loading={loading}
          loadingRows={5}
          emptyText={t("analytics.emptyGroup")}
          maxBodyHeight={false}
        />
      </ChartCard>
    </div>
  );
}
