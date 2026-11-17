// Helpers for the analytics screens: the browser time zone the API buckets in, the date window,
// and the wording of percentages, scores and trend buckets.

import { DATE_LOCALE, getLocale } from "@/lib/i18n";
import { isoDate, todayISO } from "@/lib/sla";
import type { AnalyticsInterval } from "@/types/analytics";

/** The longest window the analytics routes accept, in days. */
export const MAX_ANALYTICS_DAYS = 367;

/** The default window: today and the 29 days before it, the API's own default. */
export const DEFAULT_ANALYTICS_DAYS = 30;

const DAY_MS = 86_400_000;

/** The browser's IANA time zone, so day boundaries and "today" match the person's clock. */
export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function localMidnight(date: string, addDays = 0): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d + addDays);
}

/** A YYYY-MM-DD date moved by a number of days. */
export function shiftDate(date: string, days: number): string {
  return isoDate(localMidnight(date, days));
}

/** The last `days` days up to today, as the API's inclusive `from` and `to` dates. */
export function lastDays(days: number): { from: string; to: string } {
  const to = todayISO();
  return { from: shiftDate(to, -(days - 1)), to };
}

/** Whole days from `from` to `to`, both included. Zero or less when the range is backwards. */
export function daysInRange(from: string, to: string): number {
  if (!from || !to) return 0;
  return Math.round((localMidnight(to, 1).getTime() - localMidnight(from).getTime()) / DAY_MS);
}

/** "92.5%", or "-" when nothing was measured. */
export function formatPct(v: number | null | undefined): string {
  return v == null ? "-" : `${Math.round(v * 10) / 10}%`;
}

/** A CSAT average on the 1 to 5 scale, "4.35", or "-" without responses. */
export function formatScore(v: number | null | undefined): string {
  return v == null ? "-" : v.toFixed(2);
}

/** A whole count with the language's digit grouping. */
export function formatCount(v: number | null | undefined): string {
  return v == null ? "-" : new Intl.NumberFormat(DATE_LOCALE[getLocale()]).format(v);
}

/**
 * A trend bucket's start, worded for its interval in the period's time zone: "14:00" style for
 * hours, the day for days and weeks, the month for months.
 */
export function formatBucket(bucket: string, interval: AnalyticsInterval, timeZone: string): string {
  const date = new Date(bucket);
  if (Number.isNaN(date.getTime())) return bucket;
  const options: Intl.DateTimeFormatOptions =
    interval === "hour"
      ? { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }
      : interval === "month"
        ? { month: "short", year: "numeric" }
        : { day: "numeric", month: "short" };
  try {
    return new Intl.DateTimeFormat(DATE_LOCALE[getLocale()], { ...options, timeZone }).format(date);
  } catch {
    return new Intl.DateTimeFormat(DATE_LOCALE[getLocale()], options).format(date);
  }
}
