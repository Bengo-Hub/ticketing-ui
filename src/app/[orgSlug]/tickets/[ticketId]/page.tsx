"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, GitMerge, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { flattenPages, useDeleteTicket, useTicket, useTicketComments } from "@/hooks/useTickets";
import { useCommentStream } from "@/hooks/useSSE";
import { usePresence } from "@/hooks/usePresence";
import { useServicePermissions } from "@/hooks/useServicePermissions";
import { useT } from "@/hooks/useT";
import { PERM } from "@/lib/rbac/permissions";
import { PageHeader } from "@/components/common/page-header";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/base";
import { TicketStatusBadge } from "@/components/tickets/TicketStatusBadge";
import { PriorityBadge } from "@/components/tickets/PriorityBadge";
import { SLAStatusBadge } from "@/components/tickets/SLAStatusBadge";
import { SLASidebar } from "@/components/tickets/SLASidebar";
import { TicketConversation } from "@/components/tickets/TicketConversation";
import { ReplyComposer } from "@/components/tickets/ReplyComposer";
import { TicketProperties } from "@/components/tickets/TicketProperties";
import { TicketLinks } from "@/components/tickets/TicketLinks";
import { MergeDialog } from "@/components/tickets/MergeDialog";
import { PresenceBanner } from "@/components/tickets/PresenceBanner";
import { TicketAttachments } from "@/components/tickets/attachments/TicketAttachments";
import { useTicketLabels } from "@/lib/ticket-options";
import { formatDateTime, formatRelativeTime, orgRoute } from "@/lib/utils";
import type { Ticket } from "@/types/tickets";

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right font-medium">{children}</span>
    </div>
  );
}

/** Read-only facts about the ticket. Staff edit tags in the properties pane, so tags show here for customers. */
function TicketDetails({ ticket, showTags }: { ticket: Ticket; showTags: boolean }) {
  const { t } = useT();
  const labels = useTicketLabels();
  return (
    <section aria-label={t("ticket.details")} className="space-y-2.5 rounded-xl border border-border bg-card p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("ticket.details")}</h2>
      <DetailRow label={t("ticket.channel")}>{labels.channel(ticket.channel)}</DetailRow>
      <DetailRow label={t("ticket.created")}>{formatDateTime(ticket.created_at)}</DetailRow>
      <DetailRow label={t("ticket.updated")}>{formatRelativeTime(ticket.updated_at)}</DetailRow>
      {ticket.first_response_at && (
        <DetailRow label={t("ticket.firstResponse")}>{formatDateTime(ticket.first_response_at)}</DetailRow>
      )}
      {ticket.resolved_at && <DetailRow label={t("ticket.resolved")}>{formatDateTime(ticket.resolved_at)}</DetailRow>}
      {ticket.closed_at && <DetailRow label={t("ticket.closed")}>{formatDateTime(ticket.closed_at)}</DetailRow>}
      {ticket.escalation_level > 0 && (
        <DetailRow label={t("ticket.escalation")}>{t("ticket.escalationLevel", { n: ticket.escalation_level })}</DetailRow>
      )}
      {ticket.external_reference && <DetailRow label={t("ticket.reference")}>{ticket.external_reference}</DetailRow>}
      {showTags && ticket.tags && ticket.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {ticket.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
              {tag}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;
  const ticketId = params.ticketId as string;
  useCommentStream(orgSlug, ticketId);

  const { t } = useT();
  const { can, isStaff, profile } = useServicePermissions(orgSlug);
  const { data: ticket, isLoading, isError } = useTicket(orgSlug, ticketId);
  const commentsQuery = useTicketComments(orgSlug, ticketId);
  const comments = useMemo(() => flattenPages(commentsQuery.data), [commentsQuery.data]);
  const deleteTicket = useDeleteTicket(orgSlug);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [merging, setMerging] = useState(false);
  // Presence, links and merges cover other people's work, so they are for staff with the
  // tenant-wide view, as on the API.
  const staffDesk = isStaff && can(PERM.ticketsView);
  const presence = usePresence(orgSlug, ticketId, { enabled: staffDesk, selfUserId: profile?.user_id });

  if (isError) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <p className="text-sm font-medium">{t("ticket.loadFailed")}</p>
      </div>
    );
  }

  if (isLoading || !ticket) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  const breached = ticket.sla_response_breached || ticket.sla_resolution_breached;
  const canReply = can(PERM.commentsAdd) && ticket.status !== "cancelled";
  const canChange = can(PERM.ticketsChange);
  // A merge writes merged_into (the target id) and merged_into_number on the closed ticket.
  const meta = ticket.metadata ?? {};
  const mergedInto = typeof meta.merged_into === "string" ? meta.merged_into : "";
  const mergedIntoNumber = typeof meta.merged_into_number === "string" ? meta.merged_into_number : "";
  const canMerge = staffDesk && canChange && !mergedInto && ticket.status !== "closed" && ticket.status !== "cancelled";
  const canSeeFiles = can(PERM.attachmentsView, PERM.attachmentsViewOwn);

  const onDelete = async () => {
    try {
      await deleteTicket.mutateAsync(ticket.id);
      toast.success(t("ticket.deleted"));
      router.push(orgRoute(orgSlug, "/tickets"));
    } catch {
      toast.error(t("ticket.deleteFailed"));
    }
  };

  return (
    <div className="mx-auto max-w-384">
      <PageHeader
        back={{ href: orgRoute(orgSlug, "/tickets"), label: t("tickets.title") }}
        title={ticket.subject}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold">#{ticket.ticket_number}</span>
            <TicketStatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <SLAStatusBadge ticket={ticket} />
          </span>
        }
        actions={
          canMerge || can(PERM.ticketsDelete) ? (
            <div className="flex flex-wrap gap-2">
              {canMerge && (
                <Button variant="outline" onClick={() => setMerging(true)}>
                  <GitMerge className="h-4 w-4" /> {t("merge.action")}
                </Button>
              )}
              {can(PERM.ticketsDelete) && (
                <Button variant="outline" onClick={() => setConfirmDelete(true)} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" /> {t("ticket.delete")}
                </Button>
              )}
            </div>
          ) : undefined
        }
      />

      {staffDesk && <PresenceBanner others={presence.others} />}

      {mergedInto && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
          <GitMerge className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span>{t("merge.mergedInto")}</span>
          <Link href={orgRoute(orgSlug, `/tickets/${mergedInto}`)} className="font-mono font-semibold text-primary hover:underline">
            #{mergedIntoNumber || mergedInto.slice(0, 8)}
          </Link>
        </div>
      )}

      {breached && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="text-sm font-semibold">
            {ticket.sla_resolution_breached ? t("ticket.resolutionMissed") : t("ticket.responseMissed")}
          </p>
        </div>
      )}

      {/*
        Phones stack conversation, then properties, then details. From lg the properties and SLA sit in
        a right rail; from xl the details move to a left pane for the full three-pane workspace.
      */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_19rem] xl:grid-cols-[16rem_minmax(0,1fr)_19rem]">
        <div className="min-w-0 space-y-4 xl:col-start-2 xl:row-start-1">
          <TicketConversation
            ticket={ticket}
            comments={comments}
            loading={commentsQuery.isLoading}
            hasMore={!!commentsQuery.hasNextPage}
            loadingMore={commentsQuery.isFetchingNextPage}
            onLoadMore={() => void commentsQuery.fetchNextPage()}
          />
          {canReply && (
            <ReplyComposer
              orgSlug={orgSlug}
              ticketId={ticket.id}
              allowInternal={isStaff}
              allowMacros={staffDesk && canChange}
              allowAttachments={can(PERM.attachmentsAdd)}
              onTypingChange={staffDesk ? presence.setTyping : undefined}
            />
          )}
        </div>
        <aside className="min-w-0 space-y-4 xl:col-start-3 xl:row-start-1">
          {isStaff && <TicketProperties orgSlug={orgSlug} ticket={ticket} />}
          {canSeeFiles && <TicketAttachments orgSlug={orgSlug} ticketId={ticket.id} />}
          {staffDesk && <TicketLinks orgSlug={orgSlug} ticketId={ticket.id} canChange={canChange} />}
          {(ticket.sla_response_due_at || ticket.sla_resolution_due_at) && (
            <div className="rounded-xl border border-border bg-card p-4">
              <SLASidebar ticket={ticket} />
            </div>
          )}
          <div className="xl:hidden">
            <TicketDetails ticket={ticket} showTags={!isStaff} />
          </div>
        </aside>
        <aside className="hidden min-w-0 xl:col-start-1 xl:row-start-1 xl:block">
          <TicketDetails ticket={ticket} showTags={!isStaff} />
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t("ticket.deleteTitle")}
        description={t("ticket.deleteBody", { number: ticket.ticket_number })}
        confirmLabel={t("ticket.deleteConfirm")}
        loading={deleteTicket.isPending}
        onConfirm={() => void onDelete()}
      />

      {merging && <MergeDialog orgSlug={orgSlug} ticket={ticket} open={merging} onOpenChange={setMerging} />}
    </div>
  );
}
