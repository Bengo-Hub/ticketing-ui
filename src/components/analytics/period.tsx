"use client";

import { Info } from "lucide-react";
import { DATE_LOCALE, getLocale, type Translate } from "@/lib/i18n";
import { formatBucket } from "@/lib/analytics";
import type { AnalyticsPeriod, TrendPoint } from "@/types/analytics";

function day(iso: string, timeZone: string): string {
  const date = new Date(iso);
  const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  try {
    return new Intl.DateTimeFormat(DATE_LOCALE[getLocale()], { ...options, timeZone }).format(date);
  } catch {
    return new Intl.DateTimeFormat(DATE_LOCALE[getLocale()], options).format(date);
  }
}

/** "1 Oct 2026 to 30 Oct 2026". The API's `to` is exclusive, so the last day shown is the one before. */
export function rangeText(from: string, toExclusive: string, timeZone: string, t: Translate): string {
  const last = new Date(new Date(toExclusive).getTime() - 1).toISOString();
  return t("analytics.range", { from: day(from, timeZone), to: day(last, timeZone) });
}

/** The comparison wording KPI cards use: "the previous period (1 Sep 2026 to 30 Sep 2026)". */
export function previousLabel(period: AnalyticsPeriod | undefined, t: Translate): string | undefined {
  if (!period) return undefined;
  return t("analytics.previousRangeLabel", { range: rangeText(period.previous_from, period.previous_to, period.tz, t) });
}

/** Trend points with a label for the chart's axis, in the period's interval and time zone. */
export function chartPoints(period: AnalyticsPeriod | undefined, trend: TrendPoint[] | undefined) {
  if (!period || !trend) return [];
  return trend.map((p) => ({ ...p, label: formatBucket(p.bucket, period.interval, period.tz) }));
}

/**
 * The effective window and time zone, and how fresh the rollup is: period figures trail live ones
 * by a few minutes, and right after a deploy the backfill may still be running.
 */
export function PeriodNote({ period, t }: { period: AnalyticsPeriod | undefined; t: Translate }) {
  if (!period) return null;
  const asOf = period.rollups_as_of
    ? new Intl.DateTimeFormat(DATE_LOCALE[getLocale()], { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(period.rollups_as_of))
    : null;
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {t("analytics.periodLine", { range: rangeText(period.from, period.to, period.tz, t), tz: period.tz })}
        {asOf && <> {t("analytics.asOf", { time: asOf })}</>}
      </p>
      {!period.backfill_complete && (
        <p className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
          {t("analytics.backfilling")}
        </p>
      )}
    </div>
  );
}
