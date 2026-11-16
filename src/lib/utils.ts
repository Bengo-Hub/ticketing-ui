import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  formatDate as sharedFormatDate,
  formatDateTime as sharedFormatDateTime,
  type DateFormatOptions,
  type DateInput,
} from "@bengo-hub/shared-ui-lib/format";
import { DATE_LOCALE, getLocale, relativeTime } from "@/lib/i18n";

/** The shared date formatter in the signed-in user's time zone, worded in the chosen language. */
export function formatDate(value: DateInput, timeZone?: string | null, options?: DateFormatOptions): string {
  return sharedFormatDate(value, timeZone, { locale: DATE_LOCALE[getLocale()], ...options });
}

/** The shared date and time formatter, worded in the chosen language. */
export function formatDateTime(value: DateInput, timeZone?: string | null, options?: DateFormatOptions): string {
  return sharedFormatDateTime(value, timeZone, { locale: DATE_LOCALE[getLocale()], ...options });
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function orgRoute(orgSlug: string, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `/${orgSlug}${clean === "/" ? "" : clean}`;
}

/** "just now", "5 min ago", "3 h ago", "2 days ago", then the date, in the chosen language. */
export function formatRelativeTime(dateStr: string): string {
  return relativeTime(dateStr, (v) => formatDate(v));
}
