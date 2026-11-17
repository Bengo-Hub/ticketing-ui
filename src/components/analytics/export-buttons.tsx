"use client";

import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/base";
import { useAnalyticsExport } from "@/hooks/useAnalytics";
import type { Translate } from "@/lib/i18n";
import type { AnalyticsParams, AnalyticsView, ExportFormat } from "@/types/analytics";

const FORMATS: { format: ExportFormat; label: string }[] = [
  { format: "pdf", label: "PDF" },
  { format: "csv", label: "CSV" },
  { format: "xlsx", label: "XLSX" },
];

/** PDF, CSV and XLSX downloads of the open view with the filters on screen. */
export function ExportButtons({
  orgSlug,
  view,
  params,
  disabled,
  t,
}: {
  orgSlug: string;
  view: AnalyticsView;
  params: AnalyticsParams;
  disabled?: boolean;
  t: Translate;
}) {
  const exporter = useAnalyticsExport(orgSlug, t("analytics.exportFailed"));
  const busyFormat = exporter.isPending ? exporter.variables?.format : undefined;

  return (
    <div className="flex w-full gap-2 sm:w-auto" role="group" aria-label={t("analytics.export")}>
      {FORMATS.map(({ format, label }) => (
        <Button
          key={format}
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 sm:flex-none"
          disabled={disabled || exporter.isPending}
          aria-label={t("analytics.exportAs", { format: label })}
          onClick={() => exporter.mutate({ view, format, params })}
        >
          {busyFormat === format ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Download className="h-4 w-4" aria-hidden />}
          {label}
        </Button>
      ))}
    </div>
  );
}
