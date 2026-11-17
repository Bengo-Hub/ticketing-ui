"use client";

import { useMemo } from "react";
import { DataTable, type DataTableColumn } from "@bengo-hub/shared-ui-lib/data-table";
import type { Translate } from "@/lib/i18n";
import { formatCount, formatPct, formatScore } from "@/lib/analytics";
import { formatMinutes } from "@/lib/sla";
import { useTicketLabels } from "@/lib/ticket-options";
import type { AnalyticsGroup, TargetFigures } from "@/types/analytics";
import { ChartCard } from "./chart-parts";

/** Which dimension the rows are grouped by; it decides how a row is named. */
export type GroupKind = "priority" | "channel" | "category" | "team" | "agent";

/** Which figures the table shows: ticket volume and times, SLA targets, or CSAT. */
export type GroupFigures = "volume" | "sla" | "csat";

function targetCell(f: TargetFigures) {
  return (
    <span className="whitespace-nowrap tabular-nums">
      <span className="font-medium">{formatPct(f.compliance_pct)}</span>{" "}
      <span className="text-xs text-muted-foreground">
        ({f.met} / <span className={f.breached > 0 ? "text-destructive" : undefined}>{f.breached}</span>)
      </span>
    </span>
  );
}

function figureColumns(figures: GroupFigures, t: Translate): DataTableColumn<AnalyticsGroup>[] {
  const num = (key: string, header: string, pick: (r: AnalyticsGroup) => number, hideBelow?: "sm" | "md" | "lg") => ({
    key,
    header,
    sortable: true,
    align: "right" as const,
    hideBelow,
    accessor: pick,
    render: (r: AnalyticsGroup) => <span className="tabular-nums">{formatCount(pick(r))}</span>,
  });
  const minutes = (key: string, header: string, pick: (r: AnalyticsGroup) => number | null, hideBelow?: "sm" | "md" | "lg") => ({
    key,
    header,
    sortable: true,
    align: "right" as const,
    hideBelow,
    accessor: pick,
    render: (r: AnalyticsGroup) => <span className="whitespace-nowrap tabular-nums">{formatMinutes(pick(r), t)}</span>,
  });

  if (figures === "csat") {
    return [
      num("responses", t("analytics.colResponses"), (r) => r.csat.responses),
      {
        key: "average",
        header: t("analytics.colAverage"),
        sortable: true,
        align: "right",
        accessor: (r) => r.csat.average,
        render: (r) => <span className="font-medium tabular-nums">{formatScore(r.csat.average)}</span>,
      },
      {
        key: "satisfied",
        header: t("analytics.colSatisfied"),
        sortable: true,
        align: "right",
        accessor: (r) => r.csat.satisfied_pct,
        render: (r) => <span className="tabular-nums">{formatPct(r.csat.satisfied_pct)}</span>,
      },
    ];
  }
  if (figures === "sla") {
    return [
      {
        key: "first_response",
        header: t("analytics.colFirstResponseMet"),
        sortable: true,
        align: "right",
        accessor: (r) => r.first_response_sla.compliance_pct,
        render: (r) => targetCell(r.first_response_sla),
      },
      {
        key: "resolution",
        header: t("analytics.colResolutionMet"),
        sortable: true,
        align: "right",
        accessor: (r) => r.resolution_sla.compliance_pct,
        render: (r) => targetCell(r.resolution_sla),
      },
      minutes("avg_first_response", t("analytics.colAvgFirstResponse"), (r) => r.avg_first_response_minutes, "md"),
      minutes("avg_resolution", t("analytics.colAvgResolution"), (r) => r.avg_resolution_minutes, "md"),
    ];
  }
  return [
    num("created", t("analytics.colCreated"), (r) => r.created),
    num("resolved", t("analytics.colResolved"), (r) => r.resolved),
    minutes("avg_first_response", t("analytics.colAvgFirstResponse"), (r) => r.avg_first_response_minutes, "md"),
    minutes("avg_resolution", t("analytics.colAvgResolution"), (r) => r.avg_resolution_minutes, "md"),
    {
      key: "resolution_sla",
      header: t("analytics.colResolutionMet"),
      sortable: true,
      align: "right",
      hideBelow: "lg",
      accessor: (r) => r.resolution_sla.compliance_pct,
      render: (r) => <span className="tabular-nums">{formatPct(r.resolution_sla.compliance_pct)}</span>,
    },
  ];
}

/** One breakdown the API returns, as a sortable table that turns into cards on phones. */
export function GroupTable({
  title,
  kind,
  figures,
  rows,
  loading,
  t,
}: {
  title: string;
  kind: GroupKind;
  figures: GroupFigures;
  rows: AnalyticsGroup[] | undefined;
  loading: boolean;
  t: Translate;
}) {
  const labels = useTicketLabels();
  const columns = useMemo<DataTableColumn<AnalyticsGroup>[]>(() => {
    const name = (r: AnalyticsGroup): string => {
      if (kind === "priority") return labels.priority(r.key);
      if (kind === "channel") return labels.channel(r.key);
      if (r.key === "") return t(kind === "category" ? "analytics.noCategory" : "analytics.unassigned");
      return r.name || r.key;
    };
    return [
      {
        key: "name",
        header: t(`analytics.group.${kind}`),
        primary: true,
        sortable: true,
        accessor: name,
        render: (r) => (
          <span className="min-w-0">
            <span className="block truncate font-medium">{name(r)}</span>
            {r.email && <span className="block truncate text-xs text-muted-foreground">{r.email}</span>}
          </span>
        ),
      },
      ...figureColumns(figures, t),
    ];
  }, [kind, figures, labels, t]);

  return (
    <ChartCard title={title}>
      <DataTable
        columns={columns}
        rows={rows ?? []}
        rowKey={(r) => r.key || "none"}
        loading={loading}
        loadingRows={3}
        emptyText={t("analytics.emptyGroup")}
        maxBodyHeight={false}
      />
    </ChartCard>
  );
}
