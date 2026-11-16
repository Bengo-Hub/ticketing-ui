"use client";

// DataTable columns shared by the by-priority and by-team tables of the SLA report.

import type { DataTableColumn } from "@bengo-hub/shared-ui-lib/data-table";
import type { Translate } from "@/lib/i18n";
import { formatMinutes } from "@/lib/sla";
import type { ReportStats, TargetStats } from "@/types/sla";

/** "92.5%", or "-" when nothing was measured. */
export function formatPct(v: number | null | undefined): string {
  return v == null ? "-" : `${v}%`;
}

function targetColumns<T extends ReportStats>(
  t: Translate,
  key: "first_response" | "resolution",
  label: string,
): DataTableColumn<T>[] {
  const pick = (r: T): TargetStats => r[key];
  return [
    {
      key: `${key}_compliance`,
      header: t("slaReport.colCompliance", { target: label }),
      sortable: true,
      align: "right",
      accessor: (r) => pick(r).compliance_pct,
      render: (r) => <span className="font-medium tabular-nums">{formatPct(pick(r).compliance_pct)}</span>,
    },
    {
      key: `${key}_counts`,
      header: t("slaReport.colMetBreached", { target: label }),
      hideBelow: "lg",
      align: "right",
      accessor: (r) => `${pick(r).met} / ${pick(r).breached}`,
      render: (r) => (
        <span className="tabular-nums">
          {pick(r).met} / <span className={pick(r).breached > 0 ? "text-destructive" : undefined}>{pick(r).breached}</span>
        </span>
      ),
    },
    {
      key: `${key}_avg`,
      header: t("slaReport.colAvg", { target: label }),
      sortable: true,
      hideBelow: "md",
      align: "right",
      accessor: (r) => pick(r).avg_minutes,
      render: (r) => <span className="whitespace-nowrap tabular-nums">{formatMinutes(pick(r).avg_minutes, t)}</span>,
    },
    {
      key: `${key}_p90`,
      header: t("slaReport.colP90", { target: label }),
      sortable: true,
      hideBelow: "xl",
      align: "right",
      accessor: (r) => pick(r).p90_minutes,
      render: (r) => <span className="whitespace-nowrap tabular-nums">{formatMinutes(pick(r).p90_minutes, t)}</span>,
    },
  ];
}

/** The group column first, then tickets, then each target's compliance, counts and times. */
export function buildReportColumns<T extends ReportStats>(t: Translate, group: DataTableColumn<T>): DataTableColumn<T>[] {
  return [
    { ...group, primary: true },
    {
      key: "tickets",
      header: t("slaReport.colTickets"),
      sortable: true,
      align: "right",
      accessor: (r) => r.tickets,
      render: (r) => <span className="tabular-nums">{r.tickets}</span>,
    },
    ...targetColumns<T>(t, "first_response", t("slaReport.firstResponseShort")),
    ...targetColumns<T>(t, "resolution", t("slaReport.resolutionShort")),
  ];
}
