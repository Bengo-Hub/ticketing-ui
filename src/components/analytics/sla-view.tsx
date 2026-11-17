"use client";

import { AlarmClock, CircleCheck, Hourglass, MessageSquareReply, Timer } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { KpiCard } from "@/components/common/kpi-card";
import type { Translate } from "@/lib/i18n";
import { formatPct } from "@/lib/analytics";
import { formatMinutes } from "@/lib/sla";
import type { SLAAnalytics, TargetFigures } from "@/types/analytics";
import { AXIS_TICK, ChartCard, ChartSkeleton, LEGEND_STYLE, SERIES, TOOLTIP_STYLE } from "./chart-parts";
import { GroupTable } from "./group-table";
import { chartPoints, previousLabel } from "./period";

function countsLine(f: TargetFigures | undefined, t: Translate): string | undefined {
  return f ? t("analytics.metBreached", { met: f.met, breached: f.breached }) : undefined;
}

/** Target compliance and response times against the previous period, their trends and breakdowns. */
export function SLAView({ data, loading, t }: { data: SLAAnalytics | undefined; loading: boolean; t: Translate }) {
  const cur = data?.current;
  const change = data?.change;
  const prev = previousLabel(data?.period, t);
  const points = chartPoints(data?.period, data?.trend).map((p) => ({
    label: p.label,
    firstResponsePct: p.first_response_sla.compliance_pct,
    resolutionPct: p.resolution_sla.compliance_pct,
    firstResponseMin: p.avg_first_response_minutes,
    resolutionMin: p.avg_resolution_minutes,
  }));
  const minutes = (v: unknown) => formatMinutes(typeof v === "number" ? v : null, t);
  const pct = (v: unknown) => formatPct(typeof v === "number" ? v : null);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard icon={AlarmClock} label={t("analytics.overdue")} value={data?.overdue} loading={loading} tone="destructive" footnote={t("analytics.overdueHint")} />
        <KpiCard
          icon={MessageSquareReply}
          label={t("analytics.firstResponseMet")}
          display={formatPct(cur?.first_response_sla.compliance_pct)}
          change={change?.first_response_compliance_delta ?? null}
          changeKind="points"
          previousLabel={prev}
          loading={loading}
          footnote={countsLine(cur?.first_response_sla, t)}
        />
        <KpiCard
          icon={CircleCheck}
          label={t("analytics.resolutionMet")}
          display={formatPct(cur?.resolution_sla.compliance_pct)}
          change={change?.resolution_compliance_delta ?? null}
          changeKind="points"
          previousLabel={prev}
          loading={loading}
          tone="success"
          footnote={countsLine(cur?.resolution_sla, t)}
        />
        <KpiCard
          icon={Timer}
          label={t("analytics.avgFirstResponse")}
          display={formatMinutes(cur?.avg_first_response_minutes, t)}
          change={change?.avg_first_response_pct ?? null}
          previousLabel={prev}
          loading={loading}
        />
        <KpiCard
          icon={Hourglass}
          label={t("analytics.avgResolution")}
          display={formatMinutes(cur?.avg_resolution_minutes, t)}
          change={change?.avg_resolution_pct ?? null}
          previousLabel={prev}
          loading={loading}
        />
      </div>
      <p className="text-xs text-muted-foreground">{t("analytics.slaNote")}</p>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard title={t("analytics.complianceTrend")}>
          {loading && !data ? (
            <ChartSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={points} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={AXIS_TICK} minTickGap={16} />
                <YAxis tick={AXIS_TICK} domain={[0, 100]} unit="%" />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={pct} />
                <Legend wrapperStyle={LEGEND_STYLE} />
                <Line type="monotone" dataKey="firstResponsePct" name={t("analytics.firstResponseMet")} stroke={SERIES.firstResponse} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="resolutionPct" name={t("analytics.resolutionMet")} stroke={SERIES.resolution} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
        <ChartCard title={t("analytics.timesTrend")}>
          {loading && !data ? (
            <ChartSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={points} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={AXIS_TICK} minTickGap={16} />
                <YAxis tick={AXIS_TICK} tickFormatter={minutes} width={56} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={minutes} />
                <Legend wrapperStyle={LEGEND_STYLE} />
                <Line type="monotone" dataKey="firstResponseMin" name={t("analytics.avgFirstResponse")} stroke={SERIES.firstResponse} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="resolutionMin" name={t("analytics.avgResolution")} stroke={SERIES.resolution} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
      <p className="text-xs text-muted-foreground">{t("analytics.gapsNote")}</p>

      <div className="space-y-4">
        <GroupTable title={t("analytics.byPriority")} kind="priority" figures="sla" rows={data?.by_priority} loading={loading} t={t} />
        <GroupTable title={t("analytics.byTeam")} kind="team" figures="sla" rows={data?.by_team} loading={loading} t={t} />
        <GroupTable title={t("analytics.byAgent")} kind="agent" figures="sla" rows={data?.by_agent} loading={loading} t={t} />
      </div>
    </div>
  );
}
