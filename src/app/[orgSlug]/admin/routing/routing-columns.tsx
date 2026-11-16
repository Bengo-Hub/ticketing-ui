"use client";

// DataTable column definitions for the routing rules list.

import { Pencil, Trash2 } from "lucide-react";
import type { DataTableColumn } from "@bengo-hub/shared-ui-lib/data-table";
import { currentTicketLabels } from "@/lib/ticket-options";
import { cn } from "@/lib/utils";
import type { RoutingCondition, RoutingRule } from "@/types/routing";
import { ACTION_LABEL, FIELD_LABEL, OPERATOR_LABEL } from "./routing-options";

export interface RoutingLookups {
  agentName: (id?: string) => string | undefined;
  teamName: (id?: string) => string | undefined;
  categoryName: (id?: string) => string | undefined;
}

function valueLabel(c: RoutingCondition, l: RoutingLookups, v: string): string {
  if (c.field === "priority") return currentTicketLabels().priority(v);
  if (c.field === "channel") return currentTicketLabels().channel(v);
  if (c.field === "category_id") return l.categoryName(v) ?? "Unknown category";
  return `"${v}"`;
}

export function describeCondition(c: RoutingCondition, l: RoutingLookups): string {
  const values = Array.isArray(c.value) ? c.value : [c.value];
  const field = c.field === "subject_contains" ? "Subject" : c.field === "description_contains" ? "Description" : FIELD_LABEL[c.field];
  return `${field} ${OPERATOR_LABEL[c.operator] ?? c.operator} ${values.map((v) => valueLabel(c, l, v)).join(", ")}`;
}

export function describeAction(r: RoutingRule, l: RoutingLookups): string {
  const v = r.action.value;
  const target =
    r.action.type === "assign_team"
      ? l.teamName(v)
      : r.action.type === "assign_agent"
        ? l.agentName(v)
        : currentTicketLabels().priority(v);
  return `${ACTION_LABEL[r.action.type] ?? r.action.type}: ${target ?? "unknown"}`;
}

export function buildRoutingColumns({
  lookups,
  canManage,
  onEdit,
  onDelete,
}: {
  lookups: RoutingLookups;
  canManage: boolean;
  onEdit: (r: RoutingRule) => void;
  onDelete: (r: RoutingRule) => void;
}): DataTableColumn<RoutingRule>[] {
  const cols: DataTableColumn<RoutingRule>[] = [
    {
      key: "sort_order",
      header: "Order",
      align: "right",
      sortable: true,
      hideBelow: "md",
      accessor: (r) => r.sort_order,
    },
    {
      key: "name",
      header: "Rule",
      primary: true,
      sortable: true,
      accessor: (r) => r.name,
      render: (r) => (
        <div className="min-w-0">
          <p className={cn("truncate font-medium", !r.is_active && "text-muted-foreground line-through")}>{r.name}</p>
          {r.description && <p className="truncate text-xs text-muted-foreground">{r.description}</p>}
        </div>
      ),
    },
    {
      key: "conditions",
      header: "When",
      accessor: (r) => (r.conditions ?? []).map((c) => describeCondition(c, lookups)).join(" and "),
      render: (r) => (
        <ul className="space-y-0.5 text-sm">
          {(r.conditions ?? []).map((c, i) => (
            <li key={i} className="break-words">
              {describeCondition(c, lookups)}
            </li>
          ))}
        </ul>
      ),
    },
    {
      key: "action",
      header: "Then",
      accessor: (r) => describeAction(r, lookups),
    },
    {
      key: "is_active",
      header: "State",
      hideBelow: "md",
      accessor: (r) => (r.is_active ? "Active" : "Inactive"),
    },
  ];
  if (canManage) {
    cols.push({
      key: "actions",
      header: "",
      align: "right",
      exportable: false,
      mobileAction: true,
      render: (r) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onEdit(r)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label={`Edit ${r.name}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(r)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Delete ${r.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    });
  }
  return cols;
}
