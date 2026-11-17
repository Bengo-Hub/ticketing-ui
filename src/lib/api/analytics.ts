import { api } from "@/lib/api-client";
import type { AnalyticsByView, AnalyticsParams, AnalyticsView, ExportFormat } from "@/types/analytics";

/** Drops empty filters so the API applies its own defaults. */
function clean(params: AnalyticsParams): Record<string, string> {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== "")) as Record<string, string>;
}

/** GET /{tenant}/analytics/{view}. Every view reads the rollup, so the call stays fast on any window. */
export async function getAnalytics<V extends AnalyticsView>(
  tenantSlug: string,
  view: V,
  params: AnalyticsParams,
  signal?: AbortSignal,
): Promise<AnalyticsByView[V]> {
  const { data } = await api.get<AnalyticsByView[V]>(`api/v1/${tenantSlug}/analytics/${view}`, {
    params: clean(params),
    signal,
  });
  return data;
}

/** The file name from `Content-Disposition: attachment; filename="..."`, if the API sent one. */
function fileNameFrom(disposition: unknown): string | undefined {
  if (typeof disposition !== "string") return undefined;
  const star = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (star) return decodeURIComponent(star[1]);
  return /filename="?([^";]+)"?/i.exec(disposition)?.[1];
}

/**
 * GET /{tenant}/analytics/{view}/export with the view's filters, saved through the browser. The
 * file is the API's reports module rendering of the same figures the screen shows.
 */
export async function downloadAnalyticsExport(
  tenantSlug: string,
  view: AnalyticsView,
  format: ExportFormat,
  params: AnalyticsParams,
): Promise<void> {
  const res = await api.get<Blob>(`api/v1/${tenantSlug}/analytics/${view}/export`, {
    params: { ...clean(params), format },
    responseType: "blob",
  });
  const name = fileNameFrom(res.headers["content-disposition"]) ?? `${view}-analytics.${format}`;
  const url = URL.createObjectURL(res.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoked on the next tick, after the browser has started the download.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
