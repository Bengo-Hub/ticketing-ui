"use client";

// DataTable column definitions for the macros list.

import { Pencil, Trash2 } from "lucide-react";
import type { DataTableColumn } from "@bengo-hub/shared-ui-lib/data-table";
import { toPlainText } from "@/components/common/rich-text";
import type { Translate } from "@/lib/i18n";
import type { TicketLabels } from "@/lib/ticket-options";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Macro } from "@/types/workspace";

/** The actions a macro takes, in a few words: "Status: Resolved, Tags: refund". */
export function describeActions(m: Macro, labels: TicketLabels, t: Translate): string {
  const a = m.actions ?? {};
  const parts: string[] = [];
  if (a.status) parts.push(`${t("macros.fieldStatus")}: ${labels.status(a.status)}`);
  if (a.priority) parts.push(`${t("macros.fieldPriority")}: ${labels.priority(a.priority)}`);
  if (a.agent_id || a.team_id) parts.push(t("macros.assigns"));
  if (a.category_id) parts.push(t("macros.setsCategory"));
  if (a.add_tags?.length) parts.push(`${t("macros.fieldTags")}: ${a.add_tags.join(", ")}`);
  if (a.comment_type === "internal") parts.push(t("macros.asNote"));
  return parts.join(", ");
}

export function buildMacroColumns({
  labels,
  t,
  onEdit,
  onDelete,
}: {
  labels: TicketLabels;
  t: Translate;
  onEdit: (m: Macro) => void;
  onDelete: (m: Macro) => void;
}): DataTableColumn<Macro>[] {
  return [
    {
      key: "name",
      header: t("macros.colName"),
      primary: true,
      sortable: true,
      accessor: (m) => m.name,
      render: (m) => (
        <div className="min-w-0 max-w-md">
          <p className={cn("truncate font-medium", !m.is_active && "text-muted-foreground line-through")}>{m.name}</p>
          {m.body && <p className="truncate text-xs text-muted-foreground">{toPlainText(m.body)}</p>}
        </div>
      ),
    },
    {
      key: "actions_summary",
      header: t("macros.colActions"),
      hideBelow: "md",
      accessor: (m) => describeActions(m, labels, t),
      render: (m) => <span className="text-sm text-muted-foreground">{describeActions(m, labels, t) || t("macros.replyOnly")}</span>,
    },
    {
      key: "is_active",
      header: t("macros.colState"),
      hideBelow: "md",
      accessor: (m) => (m.is_active ? t("macros.active") : t("macros.inactive")),
    },
    {
      key: "updated_at",
      header: t("macros.colUpdated"),
      align: "right",
      hideBelow: "lg",
      accessor: (m) => m.updated_at,
      render: (m) => <span className="whitespace-nowrap text-xs text-muted-foreground">{formatRelativeTime(m.updated_at)}</span>,
    },
    {
      key: "row_actions",
      header: "",
      align: "right",
      exportable: false,
      mobileAction: true,
      render: (m) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onEdit(m)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label={t("macros.editNamed", { name: m.name })}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(m)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label={t("macros.deleteNamed", { name: m.name })}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];
}
