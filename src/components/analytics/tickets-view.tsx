"use client";

import { AlarmClock, CircleCheck, Inbox, MessageSquareReply, PlusCircle, Timer, UserX, Hourglass, ShieldCheck } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { KpiCard } from "@/components/common/kpi-card";
import type { Translate } from "@/lib/i18n";
import { formatCount, formatPct } from "@/lib/analytics";
import { formatMinutes } from "@/lib/sla";
import { useTicketLabels } from "@/lib/ticket-options";
import type { TicketsAnalytics } from "@/types/analytics";
import { AXIS_TICK, ChartCard, ChartSkeleton, LEGEND_STYLE, LegendRow, SERIES, STATUS_COLORS, TOOLTIP_STYLE } from "./chart-parts";
import { GroupTable } from "./group-table";
import { chartPoints, previousLabel } from "./period";

const OPEN_STATUSES = ["new", "open", "in_progress", "pending_customer", "pending_internal"] as const;

/** Live backlog, the period's volume and times against the previous period, the trend and breakdowns. */
export function TicketsView({ data, loading, t }: { data: TicketsAnalytics | undefined; loading: boolean; t: Translate }) {
  const labels = useTicketLabels();
  const stats = data?.stats;
  const cur = data?.current;
  const change = data?.change;
  const prev = previousLabel(data?.period, t);
  const points = chartPoints(data?.period, data?.trend);

  return (
    <div className="space-y-5">
      <section aria-labelledby="an-live" className="space-y-2">
        <h2 id="an-live" className="text-sm font-semibold text-muted-foreground">
          {t("analytics.liveHeading")}
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <KpiCard icon={Inbox} label={t("analytics.open")} value={stats?.open} loading={loading} footnote={t("analytics.openHint")} />
          <KpiCard icon={AlarmClock} label={t("analytics.overdue")} value={stats?.overdue} loading={loading} tone="destructive" footnote={t("analytics.overdueHint")} />
          <KpiCard icon={UserX} label={t("analytics.unassignedNow")} value={stats?.unassigned} loading={loading} tone="warning" />
          <KpiCard icon={PlusCircle} label={t("analytics.createdToday")} value={stats?.created_today} loading={loading} />
          <KpiCard icon={CircleCheck} label={t("analytics.resolvedToday")} value={stats?.resolved_today} loading={loading} tone="success" />
        </div>
      </section>

      <section aria-labelledby="an-period" className="space-y-2">
        <h2 id="an-period" className="text-sm font-semibold text-muted-foreground">
          {t("analytics.periodHeading")}
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <KpiCard icon={PlusCircle} label={t("analytics.created")} display={formatCount(cur?.created)} change={change?.created_pct ?? null} previousLabel={prev} loading={loading} />
          <KpiCard icon={CircleCheck} label={t("analytics.resolved")} display={formatCount(cur?.resolved)} change={change?.resolved_pct ?? null} previousLabel={prev} loading={loading} tone="success" />
          <KpiCard
            icon={MessageSquareReply}
            label={t("analytics.avgFirstResponse")}
            display={formatMinutes(cur?.avg_first_response_minutes, t)}
            change={change?.avg_first_response_pct ?? null}
            previousLabel={prev}
            loading={loading}
          />
          <KpiCard
            icon={Timer}
            label={t("analytics.avgResolution")}
            display={formatMinutes(cur?.avg_resolution_minutes, t)}
            change={change?.avg_resolution_pct ?? null}
            previousLabel={prev}
            loading={loading}
          />
          <KpiCard
            icon={ShieldCheck}
            label={t("analytics.resolutionMet")}
            display={formatPct(cur?.resolution_sla.compliance_pct)}
            change={change?.resolution_compliance_delta ?? null}
            changeKind="points"
            previousLabel={prev}
            loading={loading}
          />
        </div>
        <p className="text-xs text-muted-foreground">{t("analytics.timesNote")}</p>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title={t("analytics.createdResolvedTrend")} className="lg:col-span-2">
          {loading && !data ? (
            <ChartSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={points} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="an-created" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={SERIES.created} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={SERIES.created} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="an-resolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={SERIES.resolved} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={SERIES.resolved} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={AXIS_TICK} minTickGap={16} />
                <YAxis tick={AXIS_TICK} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={LEGEND_STYLE} />
                <Area type="monotone" dataKey="created" name={t("analytics.created")} stroke={SERIES.created} fill="url(#an-created)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="resolved" name={t("analytics.resolved")} stroke={SERIES.resolved} fill="url(#an-resolved)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title={t("analytics.openByStatus")} description={t("analytics.liveHint")}>
          <div className="space-y-1 p-2 sm:p-0">
            {loading && !data ? (
              <ChartSkeleton height={200} />
            ) : (
              OPEN_STATUSES.map((s) => (
                <LegendRow key={s} label={labels.status(s)} value={formatCount(stats?.by_status[s] ?? 0)} color={STATUS_COLORS[s]} />
              ))
            )}
            {stats && (
              <p className="flex items-center gap-1 pt-1 text-xs text-muted-foreground">
                <Hourglass className="h-3.5 w-3.5" aria-hidden /> {t("analytics.openTotal", { n: formatCount(stats.open) })}
              </p>
            )}
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <GroupTable title={t("analytics.byPriority")} kind="priority" figures="volume" rows={data?.by_priority} loading={loading} t={t} />
        <GroupTable title={t("analytics.byChannel")} kind="channel" figures="volume" rows={data?.by_channel} loading={loading} t={t} />
        <GroupTable title={t("analytics.byCategory")} kind="category" figures="volume" rows={data?.by_category} loading={loading} t={t} />
        <GroupTable title={t("analytics.byTeam")} kind="team" figures="volume" rows={data?.by_team} loading={loading} t={t} />
      </div>
    </div>
  );
}
