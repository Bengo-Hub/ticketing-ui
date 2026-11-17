"use client";

import Link from "next/link";
import { MessageSquareText, Smile, Star } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { KpiCard } from "@/components/common/kpi-card";
import type { Translate } from "@/lib/i18n";
import { formatCount, formatPct, formatScore } from "@/lib/analytics";
import { formatDateTime, orgRoute } from "@/lib/utils";
import type { CsatAnalytics, CsatScore } from "@/types/analytics";
import { AXIS_TICK, ChartCard, ChartSkeleton, LEGEND_STYLE, SCORE_COLORS, SERIES, TOOLTIP_STYLE } from "./chart-parts";
import { GroupTable } from "./group-table";
import { chartPoints, previousLabel } from "./period";

const SCORES: CsatScore[] = ["1", "2", "3", "4", "5"];

/** Survey results: the average and satisfied share against the previous period, trend, spread and comments. */
export function CsatView({
  orgSlug,
  data,
  loading,
  t,
}: {
  orgSlug: string;
  data: CsatAnalytics | undefined;
  loading: boolean;
  t: Translate;
}) {
  const cur = data?.current;
  const change = data?.change;
  const prev = previousLabel(data?.period, t);
  const spread = SCORES.map((s, i) => ({ score: s, label: t(`csat.score${s}`), count: cur?.scores[s] ?? 0, fill: SCORE_COLORS[i] }));
  const points = chartPoints(data?.period, data?.trend).map((p) => ({
    label: p.label,
    responses: p.csat.responses,
    average: p.csat.average,
  }));
  const comments = data?.recent_comments ?? [];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard
          icon={Star}
          label={t("analytics.csatAverage")}
          display={cur ? t("analytics.outOfFive", { n: formatScore(cur.average) }) : undefined}
          change={change?.csat_average_delta ?? null}
          changeKind="score"
          previousLabel={prev}
          loading={loading}
        />
        <KpiCard
          icon={Smile}
          label={t("analytics.csatSatisfied")}
          display={formatPct(cur?.satisfied_pct)}
          change={change?.csat_satisfied_delta ?? null}
          changeKind="points"
          previousLabel={prev}
          loading={loading}
          tone="success"
          footnote={t("analytics.satisfiedHint")}
        />
        <KpiCard
          icon={MessageSquareText}
          label={t("analytics.csatResponses")}
          display={formatCount(cur?.responses)}
          change={change?.csat_responses_pct ?? null}
          previousLabel={prev}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title={t("analytics.csatTrend")} className="lg:col-span-2">
          {loading && !data ? (
            <ChartSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={points} margin={{ top: 4, right: 0, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={AXIS_TICK} minTickGap={16} />
                <YAxis yAxisId="count" tick={AXIS_TICK} allowDecimals={false} />
                <YAxis yAxisId="score" orientation="right" tick={AXIS_TICK} domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} width={28} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={LEGEND_STYLE} />
                <Bar yAxisId="count" dataKey="responses" name={t("analytics.csatResponses")} fill={SERIES.responses} radius={[4, 4, 0, 0]} />
                <Line yAxisId="score" type="monotone" dataKey="average" name={t("analytics.csatAverage")} stroke={SERIES.csat} strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
        <ChartCard title={t("analytics.scoreSpread")}>
          {loading && !data ? (
            <ChartSkeleton height={220} />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={spread} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="score" tick={AXIS_TICK} />
                <YAxis tick={AXIS_TICK} allowDecimals={false} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  cursor={{ fill: "var(--muted)" }}
                  labelFormatter={(_l, payload) => String(payload?.[0]?.payload?.label ?? "")}
                />
                <Bar dataKey="count" name={t("analytics.csatResponses")} radius={[4, 4, 0, 0]}>
                  {spread.map((d) => (
                    <Cell key={d.score} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <GroupTable title={t("analytics.byAgent")} kind="agent" figures="csat" rows={data?.by_agent} loading={loading} t={t} />
        <GroupTable title={t("analytics.byTeam")} kind="team" figures="csat" rows={data?.by_team} loading={loading} t={t} />
        <GroupTable title={t("analytics.byChannel")} kind="channel" figures="csat" rows={data?.by_channel} loading={loading} t={t} />

        <ChartCard title={t("analytics.recentComments")} description={t("analytics.recentCommentsHint")}>
          {loading && !data ? (
            <ChartSkeleton height={160} />
          ) : comments.length === 0 ? (
            <p className="p-2 text-sm text-muted-foreground sm:p-0">{t("analytics.noComments")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {comments.map((c) => (
                <li key={`${c.ticket_id}-${c.submitted_at}`} className="space-y-1 p-2 sm:px-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <Link href={orgRoute(orgSlug, `/tickets/${c.ticket_id}`)} className="font-mono font-medium text-primary hover:underline">
                      {c.ticket_number}
                    </Link>
                    <span className="inline-flex items-center gap-1">
                      <span
                        className="inline-flex h-5 min-w-5 items-center justify-center rounded px-1 text-xs font-semibold text-white"
                        style={{ backgroundColor: SCORE_COLORS[Math.min(Math.max(c.score, 1), 5) - 1] }}
                        aria-label={t("analytics.scoreOf", { n: c.score })}
                      >
                        {c.score}
                      </span>
                      <span>{formatDateTime(c.submitted_at)}</span>
                    </span>
                  </div>
                  <p className="whitespace-pre-line break-words text-sm">{c.comment}</p>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
