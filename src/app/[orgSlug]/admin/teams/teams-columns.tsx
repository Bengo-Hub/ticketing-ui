"use client";

// DataTable column definitions for the Teams admin list.

import { Pencil, Trash2 } from "lucide-react";
import type { DataTableColumn } from "@bengo-hub/shared-ui-lib/data-table";
import { cn, formatDate } from "@/lib/utils";
import type { Team } from "@/types/agents";

export function buildTeamColumns({
  canManage,
  onEdit,
  onDelete,
}: {
  canManage: boolean;
  onEdit: (t: Team) => void;
  onDelete: (t: Team) => void;
}): DataTableColumn<Team>[] {
  const cols: DataTableColumn<Team>[] = [
    {
      key: "name",
      header: "Team",
      primary: true,
      sortable: true,
      accessor: (t) => t.name,
      render: (t) => (
        <div className="min-w-0">
          <p className={cn("truncate font-medium", !t.is_active && "text-muted-foreground line-through")}>{t.name}</p>
          {t.description && <p className="truncate text-xs text-muted-foreground">{t.description}</p>}
        </div>
      ),
    },
    {
      key: "agent_count",
      header: "Agents",
      align: "right",
      sortable: true,
      accessor: (t) => t.agent_count ?? 0,
    },
    {
      key: "is_active",
      header: "State",
      filterable: true,
      accessor: (t) => (t.is_active ? "Active" : "Inactive"),
    },
    {
      key: "created_at",
      header: "Created",
      hideBelow: "md",
      sortable: true,
      accessor: (t) => t.created_at,
      render: (t) => <span className="text-xs text-muted-foreground">{formatDate(t.created_at)}</span>,
    },
  ];
  if (canManage) {
    cols.push({
      key: "actions",
      header: "",
      align: "right",
      exportable: false,
      mobileAction: true,
      render: (t) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onEdit(t)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label={`Edit ${t.name}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(t)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Delete ${t.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    });
  }
  return cols;
}
