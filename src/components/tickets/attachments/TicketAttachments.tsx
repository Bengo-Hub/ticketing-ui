"use client";

import { useMemo, useState } from "react";
import { Download, FileText, Loader2, Lock, Paperclip, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { LoadMore } from "@/components/common/load-more";
import { flattenPages } from "@/hooks/useTickets";
import { useAttachments, useDeleteAttachment } from "@/hooks/useAttachments";
import { useServicePermissions } from "@/hooks/useServicePermissions";
import { useT } from "@/hooks/useT";
import { getAttachmentLink } from "@/lib/api/workspace";
import { PERM } from "@/lib/rbac/permissions";
import { formatRelativeTime } from "@/lib/utils";
import type { TicketAttachment } from "@/types/tickets";
import { formatBytes } from "./format";

/**
 * Starts a download through a fresh signed link. The link lives five minutes, so it is fetched
 * on each click and never stored. The API serves the file as a download, so following the link
 * keeps the page where it is.
 */
export async function downloadAttachment(slug: string, a: TicketAttachment): Promise<void> {
  const link = await getAttachmentLink(slug, a.ticket_id, a.id);
  const anchor = document.createElement("a");
  anchor.href = link.url;
  anchor.download = link.filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

/** A ticket's files, with download for anyone who can see them and delete where allowed. */
export function TicketAttachments({ orgSlug, ticketId }: { orgSlug: string; ticketId: string }) {
  const { t } = useT();
  const { can, profile } = useServicePermissions(orgSlug);
  const query = useAttachments(orgSlug, ticketId);
  const remove = useDeleteAttachment(orgSlug, ticketId);
  const files = useMemo(() => flattenPages(query.data), [query.data]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [removing, setRemoving] = useState<TicketAttachment | null>(null);

  const canDelete = (a: TicketAttachment) =>
    can(PERM.attachmentsDelete) || (can(PERM.attachmentsDeleteOwn) && a.uploaded_by_id === profile?.user_id);

  const download = async (a: TicketAttachment) => {
    setBusyId(a.id);
    try {
      await downloadAttachment(orgSlug, a);
    } catch {
      toast.error(t("attachments.downloadFailed"));
    } finally {
      setBusyId(null);
    }
  };

  const onRemove = async () => {
    if (!removing) return;
    try {
      await remove.mutateAsync(removing.id);
      toast.success(t("attachments.deleted"));
      setRemoving(null);
    } catch {
      toast.error(t("attachments.deleteFailed"));
    }
  };

  return (
    <section aria-label={t("attachments.title")} className="space-y-3 rounded-xl border border-border bg-card p-4">
      <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Paperclip className="h-3.5 w-3.5" /> {t("attachments.title")}
      </h2>
      {query.isLoading ? (
        <div className="h-10 animate-pulse rounded-md bg-muted" />
      ) : query.isError ? (
        <p className="text-xs text-destructive">{t("attachments.loadFailed")}</p>
      ) : files.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("attachments.none")}</p>
      ) : (
        <ul className="space-y-2">
          {files.map((a) => (
            <li key={a.id} className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium" title={a.filename}>
                  {a.filename}
                </p>
                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  {formatBytes(a.size)} · {formatRelativeTime(a.created_at)}
                  {a.internal && (
                    <span className="inline-flex items-center gap-0.5 text-warning">
                      <Lock className="h-3 w-3" /> {t("attachments.internal")}
                    </span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void download(a)}
                disabled={busyId === a.id}
                aria-label={t("attachments.download", { name: a.filename })}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {busyId === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              </button>
              {canDelete(a) && (
                <button
                  type="button"
                  onClick={() => setRemoving(a)}
                  aria-label={t("attachments.delete", { name: a.filename })}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <LoadMore
        shown={files.length}
        hasMore={!!query.hasNextPage}
        loading={query.isFetchingNextPage}
        onLoadMore={() => void query.fetchNextPage()}
      />

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={t("attachments.deleteTitle", { name: removing?.filename ?? "" })}
        confirmLabel={t("attachments.deleteConfirm")}
        loading={remove.isPending}
        onConfirm={() => void onRemove()}
      />
    </section>
  );
}
