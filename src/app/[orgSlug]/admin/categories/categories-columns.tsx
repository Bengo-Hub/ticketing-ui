"use client";

// DataTable column definitions for the ticket categories list.

import { Pencil, Trash2 } from "lucide-react";
import type { DataTableColumn } from "@bengo-hub/shared-ui-lib/data-table";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/tickets";

export function buildCategoryColumns({
  parentName,
  canManage,
  onEdit,
  onDelete,
}: {
  parentName: (id?: string) => string | undefined;
  canManage: boolean;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
}): DataTableColumn<Category>[] {
  const cols: DataTableColumn<Category>[] = [
    {
      key: "name",
      header: "Category",
      primary: true,
      sortable: true,
      accessor: (c) => c.name,
      render: (c) => (
        <div className="min-w-0">
          <p className={cn("truncate font-medium", !c.is_active && "text-muted-foreground line-through")}>{c.name}</p>
          {c.description && <p className="truncate text-xs text-muted-foreground">{c.description}</p>}
        </div>
      ),
    },
    {
      key: "parent",
      header: "Parent",
      filterable: true,
      accessor: (c) => parentName(c.parent_id) ?? "",
      render: (c) => parentName(c.parent_id) ?? <span className="text-muted-foreground">Top level</span>,
    },
    {
      key: "sort_order",
      header: "Order",
      align: "right",
      sortable: true,
      hideBelow: "md",
      accessor: (c) => c.sort_order,
    },
    {
      key: "is_active",
      header: "State",
      filterable: true,
      hideBelow: "md",
      accessor: (c) => (c.is_active ? "Active" : "Inactive"),
    },
  ];
  if (canManage) {
    cols.push({
      key: "actions",
      header: "",
      align: "right",
      exportable: false,
      mobileAction: true,
      render: (c) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onEdit(c)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label={`Edit ${c.name}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(c)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Delete ${c.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    });
  }
  return cols;
}
