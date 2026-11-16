"use client";

// DataTable column definitions for ticket lists (the inbox and the agent's own queue).

import type { DataTableColumn } from "@bengo-hub/shared-ui-lib/data-table";
import { TicketStatusBadge } from "@/components/tickets/TicketStatusBadge";
import { PriorityBadge } from "@/components/tickets/PriorityBadge";
import { SLAStatusBadge } from "@/components/tickets/SLAStatusBadge";
import { CHANNEL_LABEL, PRIORITY_LABEL, STATUS_LABEL } from "@/lib/ticket-options";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";
import type { Ticket } from "@/types/tickets";

export interface TicketColumnLookups {
  /** Agent id to display name. */
  agentName: (id?: string) => string | undefined;
  /** Category id to name. */
  categoryName?: (id?: string) => string | undefined;
}

export function buildTicketColumns({ agentName, categoryName }: TicketColumnLookups): DataTableColumn<Ticket>[] {
  return [
    {
      key: "ticket_number",
      header: "Number",
      accessor: (t) => t.ticket_number,
      render: (t) => <span className="font-mono text-xs font-semibold text-muted-foreground">#{t.ticket_number}</span>,
      mobileHidden: true,
    },
    {
      key: "subject",
      header: "Subject",
      primary: true,
      accessor: (t) => t.subject,
      render: (t) => (
        <div className="min-w-0 max-w-[28rem]">
          <p className="truncate font-medium text-foreground">{t.subject}</p>
          <p className="font-mono text-[11px] text-muted-foreground md:hidden">#{t.ticket_number}</p>
          {categoryName?.(t.category_id) && (
            <p className="hidden truncate text-xs text-muted-foreground md:block">{categoryName(t.category_id)}</p>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      mobileAction: true,
      accessor: (t) => STATUS_LABEL[t.status] ?? t.status,
      render: (t) => <TicketStatusBadge status={t.status} />,
    },
    {
      key: "priority",
      header: "Priority",
      accessor: (t) => PRIORITY_LABEL[t.priority] ?? t.priority,
      render: (t) => <PriorityBadge priority={t.priority} />,
    },
    {
      key: "sla",
      header: "SLA",
      hideBelow: "lg",
      exportable: false,
      accessor: (t) => (t.sla_resolution_breached || t.sla_response_breached ? "Breached" : ""),
      render: (t) => <SLAStatusBadge ticket={t} />,
    },
    {
      key: "channel",
      header: "Channel",
      hideBelow: "lg",
      accessor: (t) => CHANNEL_LABEL[t.channel] ?? t.channel,
    },
    {
      key: "assignee",
      header: "Assignee",
      hideBelow: "md",
      accessor: (t) => agentName(t.assigned_agent_id) ?? "",
      render: (t) =>
        t.assigned_agent_id ? (
          <span className="text-sm">{agentName(t.assigned_agent_id) ?? "Agent"}</span>
        ) : (
          <span className="text-sm text-muted-foreground">Unassigned</span>
        ),
    },
    {
      key: "updated_at",
      header: "Updated",
      align: "right",
      accessor: (t) => t.updated_at,
      render: (t) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground" title={formatDateTime(t.updated_at)}>
          {formatRelativeTime(t.updated_at)}
        </span>
      ),
    },
  ];
}
