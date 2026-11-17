"use client";

import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { extractErrorMessage } from "@bengo-hub/shared-ui-lib/documents";
import { downloadAnalyticsExport, getAnalytics } from "@/lib/api/analytics";
import type { AnalyticsParams, AnalyticsView, ExportFormat } from "@/types/analytics";

/**
 * Query keys start with ["analytics", tenantSlug], so a ticket change (useTickets.ts, useSSE.ts)
 * marks every view stale at once. The figures on screen stay while new filters load.
 */
export function analyticsKey(tenantSlug: string) {
  return ["analytics", tenantSlug] as const;
}

export function useAnalytics<V extends AnalyticsView>(
  tenantSlug: string,
  view: V,
  params: AnalyticsParams,
  enabled = true,
) {
  return useQuery({
    queryKey: [...analyticsKey(tenantSlug), view, params],
    queryFn: ({ signal }) => getAnalytics(tenantSlug, view, params, signal),
    enabled: enabled && !!tenantSlug,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

/** Downloads a view's PDF, CSV or XLSX for the same filters; a refusal shows the API's message. */
export function useAnalyticsExport(tenantSlug: string, failed: string) {
  return useMutation({
    mutationFn: ({ view, format, params }: { view: AnalyticsView; format: ExportFormat; params: AnalyticsParams }) =>
      downloadAnalyticsExport(tenantSlug, view, format, params),
    onError: async (err) => {
      toast.error(await extractErrorMessage(err, failed));
    },
  });
}
