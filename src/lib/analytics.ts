import type { TicketStats, TrendPoint } from "@/types/tickets";

export interface PeriodTotals {
  created: number;
  resolved: number;
}

/**
 * Splits a trend fetched for twice the period into the latest `days` and the `days` before them.
 * The API buckets by day up to 90 days and by week beyond that, so a comparison is only offered
 * when the doubled window still has daily buckets (`days` of 45 or less); otherwise `previous` is
 * null and the card shows no change.
 */
export function splitPeriods(trend: TrendPoint[] | undefined, days: number): { current: PeriodTotals; previous: PeriodTotals | null } {
  const current: PeriodTotals = { created: 0, resolved: 0 };
  const previous: PeriodTotals = { created: 0, resolved: 0 };
  if (!trend) return { current, previous: null };
  const cutoff = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  for (const p of trend) {
    const bucket = p.date.slice(0, 10) > cutoff ? current : previous;
    bucket.created += p.created;
    bucket.resolved += p.resolved;
  }
  return { current, previous: days * 2 <= 90 ? previous : null };
}

/** Sums one period of a trend without splitting it. */
export function sumTrend(trend: TrendPoint[] | undefined): PeriodTotals {
  return (trend ?? []).reduce((t, p) => ({ created: t.created + p.created, resolved: t.resolved + p.resolved }), {
    created: 0,
    resolved: 0,
  });
}

/** Live counts derived from the per-status stats. */
export function statusCounts(stats: TicketStats | undefined) {
  const s = stats ?? {};
  const n = (k: keyof TicketStats) => s[k] ?? 0;
  return {
    total: Object.values(s).reduce((a, b) => a + (b ?? 0), 0),
    new: n("new"),
    open: n("open"),
    inProgress: n("in_progress"),
    pending: n("pending_customer") + n("pending_internal"),
    resolved: n("resolved"),
    closed: n("closed"),
    /** Every ticket still waiting on someone: new, open, in progress or pending. */
    active: n("new") + n("open") + n("in_progress") + n("pending_customer") + n("pending_internal"),
  };
}
