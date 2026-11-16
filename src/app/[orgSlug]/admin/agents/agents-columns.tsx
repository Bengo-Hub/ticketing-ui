"use client";

// DataTable column definitions for the Agents admin list.

import { Pencil, Trash2 } from "lucide-react";
import type { DataTableColumn } from "@bengo-hub/shared-ui-lib/data-table";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Agent, AgentRole, AgentStatus } from "@/types/agents";

export const ROLE_LABEL: Record<AgentRole, string> = { agent: "Agent", supervisor: "Supervisor", admin: "Admin" };
export const AGENT_STATUS_LABEL: Record<AgentStatus, string> = {
  available: "Available",
  busy: "Busy",
  away: "Away",
  offline: "Offline",
};

const STATUS_DOT: Record<AgentStatus, string> = {
  available: "bg-success",
  busy: "bg-warning",
  away: "bg-orange-500",
  offline: "bg-muted-foreground/50",
};

export function buildAgentColumns({
  teamName,
  canManage,
  onEdit,
  onDelete,
}: {
  teamName: (id?: string) => string | undefined;
  canManage: boolean;
  onEdit: (a: Agent) => void;
  onDelete: (a: Agent) => void;
}): DataTableColumn<Agent>[] {
  const cols: DataTableColumn<Agent>[] = [
    {
      key: "display_name",
      header: "Agent",
      primary: true,
      sortable: true,
      accessor: (a) => a.display_name,
      render: (a) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
            {a.display_name[0]?.toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className={cn("block truncate font-medium", !a.is_active && "text-muted-foreground line-through")}>
              {a.display_name}
            </span>
            <span className="block truncate text-xs text-muted-foreground">{a.email}</span>
          </span>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      filterable: true,
      accessor: (a) => ROLE_LABEL[a.role] ?? a.role,
    },
    {
      key: "status",
      header: "Status",
      filterable: true,
      accessor: (a) => AGENT_STATUS_LABEL[a.status] ?? a.status,
      render: (a) => (
        <span className="inline-flex items-center gap-1.5 text-sm">
          <span className={cn("h-2 w-2 rounded-full", STATUS_DOT[a.status])} aria-hidden />
          {AGENT_STATUS_LABEL[a.status] ?? a.status}
        </span>
      ),
    },
    {
      key: "team",
      header: "Team",
      filterable: true,
      hideBelow: "md",
      accessor: (a) => teamName(a.team_id) ?? "",
      render: (a) => teamName(a.team_id) ?? <span className="text-muted-foreground">No team</span>,
    },
    {
      key: "load",
      header: "Open tickets",
      align: "right",
      sortable: true,
      hideBelow: "lg",
      accessor: (a) => a.current_ticket_count,
      render: (a) => (
        <span className="tabular-nums">
          {a.current_ticket_count} / {a.max_concurrent_tickets}
        </span>
      ),
    },
    {
      key: "last_active_at",
      header: "Last active",
      hideBelow: "lg",
      accessor: (a) => a.last_active_at ?? "",
      render: (a) => (
        <span className="text-xs text-muted-foreground">{a.last_active_at ? formatRelativeTime(a.last_active_at) : "Never"}</span>
      ),
    },
  ];

  if (canManage) {
    cols.push({
      key: "actions",
      header: "",
      align: "right",
      exportable: false,
      mobileAction: true,
      render: (a) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onEdit(a)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label={`Edit ${a.display_name}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(a)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Remove ${a.display_name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    });
  }
  return cols;
}
