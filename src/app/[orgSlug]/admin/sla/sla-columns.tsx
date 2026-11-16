"use client";

// DataTable column definitions for the SLA policies list.

import { Pencil, Trash2 } from "lucide-react";
import type { DataTableColumn } from "@bengo-hub/shared-ui-lib/data-table";
import { PriorityBadge } from "@/components/tickets/PriorityBadge";
import type { Translate } from "@/lib/i18n";
import { formatMinutes } from "@/lib/sla";
import { currentTicketLabels } from "@/lib/ticket-options";
import { cn } from "@/lib/utils";
import type { SLAPolicy } from "@/types/sla";

export function buildSLAColumns({
  t,
  categoryName,
  calendarName,
  canChange,
  canDelete,
  onEdit,
  onDelete,
}: {
  t: Translate;
  categoryName: (id?: string) => string | undefined;
  calendarName: (id: string | null) => string;
  canChange: boolean;
  canDelete: boolean;
  onEdit: (p: SLAPolicy) => void;
  onDelete: (p: SLAPolicy) => void;
}): DataTableColumn<SLAPolicy>[] {
  const cols: DataTableColumn<SLAPolicy>[] = [
    {
      key: "name",
      header: t("slaPolicies.colPolicy"),
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
      header: t("slaPolicies.colPriority"),
      accessor: (p) => currentTicketLabels().priority(p.priority),
      render: (p) => <PriorityBadge priority={p.priority} />,
    },
    {
      key: "category",
      header: t("slaPolicies.colCategory"),
      hideBelow: "lg",
      accessor: (p) => categoryName(p.category_id) ?? "",
      render: (p) => categoryName(p.category_id) ?? <span className="text-muted-foreground">{t("slaPolicies.anyCategory")}</span>,
    },
    {
      key: "calendar",
      header: t("slaPolicies.colClock"),
      hideBelow: "md",
      accessor: (p) => calendarName(p.calendar_id),
    },
    {
      key: "first_response_minutes",
      header: t("slaPolicies.colFirstResponse"),
      sortable: true,
      accessor: (p) => p.first_response_minutes,
      render: (p) => <span className="whitespace-nowrap font-medium tabular-nums">{formatMinutes(p.first_response_minutes, t)}</span>,
    },
    {
      key: "resolution_minutes",
      header: t("slaPolicies.colResolution"),
      sortable: true,
      accessor: (p) => p.resolution_minutes,
      render: (p) => <span className="whitespace-nowrap font-medium tabular-nums">{formatMinutes(p.resolution_minutes, t)}</span>,
    },
    {
      key: "is_active",
      header: t("slaPolicies.colState"),
      hideBelow: "md",
      accessor: (p) => (p.is_active ? t("slaPolicies.active") : t("slaPolicies.inactive")),
    },
  ];
  if (canChange || canDelete) {
    cols.push({
      key: "actions",
      header: "",
      align: "right",
      exportable: false,
      mobileAction: true,
      render: (p) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {canChange && (
            <button
              type="button"
              onClick={() => onEdit(p)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label={t("slaPolicies.editNamed", { name: p.name })}
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(p)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label={t("slaPolicies.deleteNamed", { name: p.name })}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    });
  }
  return cols;
}
