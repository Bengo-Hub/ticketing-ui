"use client";

// DataTable column definitions for ticket lists (the inbox and the agent's own queue).

import type { DataTableColumn } from "@bengo-hub/shared-ui-lib/data-table";
import { TicketStatusBadge } from "@/components/tickets/TicketStatusBadge";
import { PriorityBadge } from "@/components/tickets/PriorityBadge";
import { SLAStatusBadge } from "@/components/tickets/SLAStatusBadge";
import { ChannelBadge } from "@/components/tickets/ChannelBadge";
import type { TicketLabels } from "@/lib/ticket-options";
import type { Translate } from "@/lib/i18n";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";
import type { Ticket } from "@/types/tickets";

export interface TicketColumnLookups {
  /** Agent id to display name. */
  agentName: (id?: string) => string | undefined;
  /** Category id to name. */
  categoryName?: (id?: string) => string | undefined;
  /** Status, priority and channel labels in the active language. */
  labels: TicketLabels;
  t: Translate;
}

export function buildTicketColumns({ agentName, categoryName, labels, t }: TicketColumnLookups): DataTableColumn<Ticket>[] {
  return [
    {
      key: "ticket_number",
      header: t("tickets.colNumber"),
      accessor: (row) => row.ticket_number,
      render: (row) => <span className="font-mono text-xs font-semibold text-muted-foreground">#{row.ticket_number}</span>,
      mobileHidden: true,
    },
    {
      key: "subject",
      header: t("tickets.colSubject"),
      primary: true,
      accessor: (row) => row.subject,
      render: (row) => (
        <div className="min-w-0 max-w-md">
          <p className="truncate font-medium text-foreground">{row.subject}</p>
          <p className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground lg:hidden">
            {/* Below lg the channel column is hidden, so the row keeps the channel as an icon. */}
            <ChannelBadge channel={row.channel} iconOnly className="font-sans" />
            <span className="md:hidden">#{row.ticket_number}</span>
          </p>
          {categoryName?.(row.category_id) && (
            <p className="hidden truncate text-xs text-muted-foreground md:block">{categoryName(row.category_id)}</p>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: t("tickets.colStatus"),
      mobileAction: true,
      accessor: (row) => labels.status(row.status),
      render: (row) => <TicketStatusBadge status={row.status} />,
    },
    {
      key: "priority",
      header: t("tickets.colPriority"),
      accessor: (row) => labels.priority(row.priority),
      render: (row) => <PriorityBadge priority={row.priority} />,
    },
    {
      key: "sla",
      header: t("tickets.colSla"),
      hideBelow: "lg",
      exportable: false,
      accessor: (row) => (row.sla_resolution_breached || row.sla_response_breached ? t("tickets.breached") : ""),
      render: (row) => <SLAStatusBadge ticket={row} />,
    },
    {
      key: "channel",
      header: t("tickets.colChannel"),
      hideBelow: "lg",
      accessor: (row) => labels.channel(row.channel),
      render: (row) => <ChannelBadge channel={row.channel} />,
    },
    {
      key: "assignee",
      header: t("tickets.colAssignee"),
      hideBelow: "md",
      accessor: (row) => agentName(row.assigned_agent_id) ?? "",
      render: (row) =>
        row.assigned_agent_id ? (
          <span className="text-sm">{agentName(row.assigned_agent_id) ?? t("tickets.agent")}</span>
        ) : (
          <span className="text-sm text-muted-foreground">{t("tickets.unassigned")}</span>
        ),
    },
    {
      key: "updated_at",
      header: t("tickets.colUpdated"),
      align: "right",
      accessor: (row) => row.updated_at,
      render: (row) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground" title={formatDateTime(row.updated_at)}>
          {formatRelativeTime(row.updated_at)}
        </span>
      ),
    },
  ];
}
