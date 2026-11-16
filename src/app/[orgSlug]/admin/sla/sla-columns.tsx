"use client";

// DataTable column definitions for the SLA policies list.

import { Pencil, Trash2 } from "lucide-react";
import type { DataTableColumn } from "@bengo-hub/shared-ui-lib/data-table";
import { PriorityBadge } from "@/components/tickets/PriorityBadge";
import { currentTicketLabels } from "@/lib/ticket-options";
import { cn } from "@/lib/utils";
import type { SLAPolicy } from "@/types/sla";

/** 90 shows as "1h 30m", 1500 as "1d 1h". */
export function formatMinutes(total: number): string {
  if (!total || total < 0) return "-";
  const d = Math.floor(total / 1440);
  const h = Math.floor((total % 1440) / 60);
  const m = total % 60;
  return [d && `${d}d`, h && `${h}h`, m && `${m}m`].filter(Boolean).join(" ");
}

function Target({ minutes, businessHours }: { minutes: number; businessHours: boolean }) {
  return (
    <span className="whitespace-nowrap">
      <span className="font-medium tabular-nums">{formatMinutes(minutes)}</span>
      <span className="ml-1 text-xs text-muted-foreground">{businessHours ? "business hours" : "calendar"}</span>
    </span>
  );
}

export function buildSLAColumns({
  categoryName,
  canManage,
  onEdit,
  onDelete,
}: {
  categoryName: (id?: string) => string | undefined;
  canManage: boolean;
  onEdit: (p: SLAPolicy) => void;
  onDelete: (p: SLAPolicy) => void;
}): DataTableColumn<SLAPolicy>[] {
  const cols: DataTableColumn<SLAPolicy>[] = [
    {
      key: "name",
      header: "Policy",
      primary: true,
      sortable: true,
      accessor: (p) => p.name,
      render: (p) => (
        <div className="min-w-0">
          <p className={cn("truncate font-medium", !p.is_active && "text-muted-foreground line-through")}>{p.name}</p>
          {p.description && <p className="truncate text-xs text-muted-foreground">{p.description}</p>}
        </div>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      accessor: (p) => currentTicketLabels().priority(p.priority),
      render: (p) => <PriorityBadge priority={p.priority} />,
    },
    {
      key: "category",
      header: "Category",
      hideBelow: "lg",
      accessor: (p) => categoryName(p.category_id) ?? "",
      render: (p) => categoryName(p.category_id) ?? <span className="text-muted-foreground">Any</span>,
    },
    {
      key: "first_response_minutes",
      header: "First response",
      sortable: true,
      accessor: (p) => p.first_response_minutes,
      render: (p) => <Target minutes={p.first_response_minutes} businessHours={p.first_response_business_hours} />,
    },
    {
      key: "resolution_minutes",
      header: "Resolution",
      sortable: true,
      accessor: (p) => p.resolution_minutes,
      render: (p) => <Target minutes={p.resolution_minutes} businessHours={p.resolution_business_hours} />,
    },
    {
      key: "is_active",
      header: "State",
      hideBelow: "md",
      accessor: (p) => (p.is_active ? "Active" : "Inactive"),
    },
  ];
  if (canManage) {
    cols.push({
      key: "actions",
      header: "",
      align: "right",
      exportable: false,
      mobileAction: true,
      render: (p) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onEdit(p)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label={`Edit ${p.name}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(p)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Delete ${p.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    });
  }
  return cols;
}
