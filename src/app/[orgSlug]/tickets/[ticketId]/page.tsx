"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useDeleteTicket, useTicket, useTicketComments } from "@/hooks/useTickets";
import { useCommentStream } from "@/hooks/useSSE";
import { useServicePermissions } from "@/hooks/useServicePermissions";
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
import { CHANNEL_LABEL } from "@/lib/ticket-options";
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

function TicketDetails({ ticket }: { ticket: Ticket }) {
  return (
    <section aria-label="Details" className="space-y-2.5 rounded-xl border border-border bg-card p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Details</h2>
      <DetailRow label="Channel">{CHANNEL_LABEL[ticket.channel] ?? ticket.channel}</DetailRow>
      <DetailRow label="Created">{formatDateTime(ticket.created_at)}</DetailRow>
      <DetailRow label="Updated">{formatRelativeTime(ticket.updated_at)}</DetailRow>
      {ticket.first_response_at && <DetailRow label="First response">{formatDateTime(ticket.first_response_at)}</DetailRow>}
      {ticket.resolved_at && <DetailRow label="Resolved">{formatDateTime(ticket.resolved_at)}</DetailRow>}
      {ticket.closed_at && <DetailRow label="Closed">{formatDateTime(ticket.closed_at)}</DetailRow>}
      {ticket.escalation_level > 0 && <DetailRow label="Escalation">Level {ticket.escalation_level}</DetailRow>}
      {ticket.external_reference && <DetailRow label="Reference">{ticket.external_reference}</DetailRow>}
      {ticket.tags && ticket.tags.length > 0 && (
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

  const { can, isStaff } = useServicePermissions(orgSlug);
  const { data: ticket, isLoading, isError } = useTicket(orgSlug, ticketId);
  const { data: comments = [], isLoading: commentsLoading } = useTicketComments(orgSlug, ticketId);
  const deleteTicket = useDeleteTicket(orgSlug);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isError) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <p className="text-sm font-medium">The ticket could not be loaded.</p>
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

  const onDelete = async () => {
    try {
      await deleteTicket.mutateAsync(ticket.id);
      toast.success("Ticket deleted");
      router.push(orgRoute(orgSlug, "/tickets"));
    } catch {
      toast.error("The ticket could not be deleted.");
    }
  };

  return (
    <div className="mx-auto max-w-[96rem]">
      <PageHeader
        back={{ href: orgRoute(orgSlug, "/tickets"), label: "Tickets" }}
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
          can(PERM.ticketsDelete) ? (
            <Button variant="outline" onClick={() => setConfirmDelete(true)} className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          ) : undefined
        }
      />

      {breached && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="text-sm font-semibold">
            {ticket.sla_resolution_breached ? "The resolution target has been missed." : "The first response target has been missed."}
          </p>
        </div>
      )}

      {/*
        Phones stack conversation, then properties, then details. From lg the properties and SLA sit in
        a right rail; from xl the details move to a left pane for the full three-pane workspace.
      */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_19rem] xl:grid-cols-[16rem_minmax(0,1fr)_19rem]">
        <div className="min-w-0 space-y-4 xl:col-start-2 xl:row-start-1">
          <TicketConversation ticket={ticket} comments={comments} loading={commentsLoading} />
          {canReply && <ReplyComposer orgSlug={orgSlug} ticketId={ticket.id} allowInternal={isStaff} />}
        </div>
        <aside className="min-w-0 space-y-4 xl:col-start-3 xl:row-start-1">
          {isStaff && <TicketProperties orgSlug={orgSlug} ticket={ticket} />}
          {(ticket.sla_response_due_at || ticket.sla_resolution_due_at) && (
            <div className="rounded-xl border border-border bg-card p-4">
              <SLASidebar ticket={ticket} />
            </div>
          )}
          <div className="xl:hidden">
            <TicketDetails ticket={ticket} />
          </div>
        </aside>
        <aside className="hidden min-w-0 xl:col-start-1 xl:row-start-1 xl:block">
          <TicketDetails ticket={ticket} />
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this ticket?"
        description={`Ticket #${ticket.ticket_number} and its conversation will be removed.`}
        confirmLabel="Delete ticket"
        loading={deleteTicket.isPending}
        onConfirm={() => void onDelete()}
      />
    </div>
  );
}
