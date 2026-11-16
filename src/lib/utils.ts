import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDate, formatDateTime } from "@bengo-hub/shared-ui-lib/format";

// Dates come from the shared formatter, which shows them in the signed-in user's time zone.
export { formatDate, formatDateTime };

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function orgRoute(orgSlug: string, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `/${orgSlug}${clean === "/" ? "" : clean}`;
}

/** "just now", "5m ago", "3h ago", "2d ago", then the date. */
export function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return "-";
  const minutes = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}
