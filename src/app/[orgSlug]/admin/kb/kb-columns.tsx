"use client";

// DataTable column definitions for the admin Knowledge Base list.

import { Eye, Pencil, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import type { DataTableColumn } from "@bengo-hub/shared-ui-lib/data-table";
import { cn, formatDateTime, formatRelativeTime } from "@/lib/utils";
import type { ArticleStatus, KBArticle } from "@/types/kb";

const STATUS_BADGE: Record<ArticleStatus, string> = {
  draft: "bg-warning/15 text-warning",
  published: "bg-success/15 text-success",
  archived: "bg-muted text-muted-foreground",
};

const STATUS_LABEL: Record<ArticleStatus, string> = { draft: "Draft", published: "Published", archived: "Archived" };

export function buildKBColumns({
  onPreview,
  onEdit,
  onDelete,
}: {
  onPreview: (a: KBArticle) => void;
  onEdit?: (a: KBArticle) => void;
  onDelete?: (a: KBArticle) => void;
}): DataTableColumn<KBArticle>[] {
  return [
    {
      key: "title",
      header: "Title",
      primary: true,
      sortable: true,
      accessor: (a) => a.title,
      render: (a) => (
        <div className="min-w-0 max-w-[28rem]">
          <p className="truncate font-medium">{a.title}</p>
          {a.excerpt && <p className="hidden truncate text-xs text-muted-foreground md:block">{a.excerpt}</p>}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      accessor: (a) => STATUS_LABEL[a.status] ?? a.status,
      render: (a) => (
        <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-semibold", STATUS_BADGE[a.status])}>
          {STATUS_LABEL[a.status] ?? a.status}
        </span>
      ),
    },
    {
      key: "visibility",
      header: "Visibility",
      filterable: true,
      hideBelow: "md",
      accessor: (a) => (a.is_public ? "Public" : "Internal"),
    },
    {
      key: "category",
      header: "Category",
      filterable: true,
      hideBelow: "lg",
      accessor: (a) => a.category ?? "",
    },
    {
      key: "views",
      header: "Views",
      align: "right",
      sortable: true,
      hideBelow: "md",
      accessor: (a) => a.view_count,
    },
    {
      key: "feedback",
      header: "Feedback",
      hideBelow: "lg",
      accessor: (a) => a.helpful_count - a.not_helpful_count,
      render: (a) => (
        <span className="inline-flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <ThumbsUp className="h-3 w-3" /> {a.helpful_count}
          </span>
          <span className="inline-flex items-center gap-1">
            <ThumbsDown className="h-3 w-3" /> {a.not_helpful_count}
          </span>
        </span>
      ),
    },
    {
      key: "updated_at",
      header: "Updated",
      sortable: true,
      accessor: (a) => a.updated_at,
      render: (a) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground" title={formatDateTime(a.updated_at)}>
          {formatRelativeTime(a.updated_at)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      exportable: false,
      mobileAction: true,
      render: (a) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {a.status === "published" && (
            <button
              type="button"
              onClick={() => onPreview(a)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label={`Preview ${a.title}`}
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(a)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label={`Edit ${a.title}`}
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(a)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label={`Delete ${a.title}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];
}
