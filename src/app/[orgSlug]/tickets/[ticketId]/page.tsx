"use client";

import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTicket, useTicketComments, useAddComment, useUpdateTicketStatus } from "@/hooks/useTickets";
import { TicketStatusBadge } from "@/components/tickets/TicketStatusBadge";
import { PriorityBadge } from "@/components/tickets/PriorityBadge";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
  Separator,
  Textarea,
} from "@/components/ui/base";
import { formatDateTime, formatRelativeTime, orgRoute } from "@/lib/utils";
import type { TicketStatus } from "@/types/tickets";
import { ArrowLeft, Loader2, MessageSquare, User, AlertCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
  comment_type: z.enum(["public", "internal"]),
});

type CommentFormData = z.infer<typeof commentSchema>;

const STATUS_TRANSITIONS: Array<{ label: string; value: TicketStatus }> = [
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in_progress" },
  { label: "Pending Customer", value: "pending_customer" },
  { label: "Pending Internal", value: "pending_internal" },
  { label: "Resolved", value: "resolved" },
  { label: "Closed", value: "closed" },
  { label: "Cancelled", value: "cancelled" },
];

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;
  const ticketId = params.ticketId as string;

  const { data: ticket, isLoading, isError } = useTicket(orgSlug, ticketId);
  const { data: comments = [], isLoading: commentsLoading } = useTicketComments(orgSlug, ticketId);
  const addComment = useAddComment(orgSlug, ticketId);
  const updateStatus = useUpdateTicketStatus(orgSlug);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: { comment_type: "public" },
  });

  const onSubmitComment = async (data: CommentFormData) => {
    try {
      await addComment.mutateAsync({
        content: data.content,
        comment_type: data.comment_type,
      });
      reset();
      toast.success("Comment added");
    } catch {
      toast.error("Failed to add comment.");
    }
  };

  const handleStatusChange = async (status: TicketStatus) => {
    try {
      await updateStatus.mutateAsync({ id: ticketId, status });
      toast.success(`Status updated to ${status}`);
    } catch {
      toast.error("Failed to update status.");
    }
  };

  if (isError) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
        <AlertCircle className="h-5 w-5" />
        <p className="text-sm font-medium">Failed to load ticket.</p>
      </div>
    );
  }

  if (isLoading || !ticket) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href={orgRoute(orgSlug, "/tickets")}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Tickets
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-sm font-mono text-muted-foreground font-bold">
              #{ticket.ticket_number}
            </span>
            <TicketStatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            {ticket.sla_response_breached && (
              <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 text-xs font-semibold">
                SLA Breached
              </span>
            )}
          </div>
          <h1 className="text-xl font-black text-foreground break-words">{ticket.subject}</h1>
        </div>

        {/* Status change */}
        <div className="flex-shrink-0">
          <select
            value={ticket.status}
            onChange={(e) => void handleStatusChange(e.target.value as TicketStatus)}
            className="h-10 rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {STATUS_TRANSITIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground whitespace-pre-wrap">{ticket.description}</p>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comments ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {commentsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No comments yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`rounded-xl p-4 ${
                        comment.comment_type === "internal"
                          ? "bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800"
                          : comment.comment_type === "system"
                          ? "bg-muted border border-border"
                          : "bg-card border border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span className="text-xs font-semibold text-foreground capitalize">
                            {comment.author_type}
                          </span>
                          {comment.comment_type === "internal" && (
                            <span className="text-xs text-yellow-700 dark:text-yellow-400 font-medium">
                              (Internal)
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              {/* Add comment form */}
              <form onSubmit={handleSubmit(onSubmitComment)} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="content">Add Comment</Label>
                  <Textarea
                    id="content"
                    placeholder="Type your comment..."
                    rows={3}
                    {...register("content")}
                  />
                  {errors.content && (
                    <p className="text-xs text-destructive">{errors.content.message}</p>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <select
                    {...register("comment_type")}
                    className="h-9 rounded-md border border-border bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="public">Public Reply</option>
                    <option value="internal">Internal Note</option>
                  </select>
                  <Button type="submit" size="sm" disabled={isSubmitting || addComment.isPending}>
                    {(isSubmitting || addComment.isPending) && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    )}
                    Submit
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar metadata */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Ticket Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Channel</span>
                <span className="font-medium capitalize">{ticket.channel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer ID</span>
                <span className="font-medium font-mono text-xs">{ticket.customer_id.slice(0, 8)}...</span>
              </div>
              {ticket.assigned_agent_id && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assignee</span>
                  <span className="font-medium font-mono text-xs">
                    {ticket.assigned_agent_id.slice(0, 8)}...
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">{formatDateTime(ticket.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span className="font-medium">{formatRelativeTime(ticket.updated_at)}</span>
              </div>
              {ticket.resolved_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resolved</span>
                  <span className="font-medium">{formatDateTime(ticket.resolved_at)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SLA */}
          {(ticket.sla_response_due_at || ticket.sla_resolution_due_at) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  SLA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {ticket.sla_response_due_at && (
                  <div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Response Due</span>
                      <span
                        className={
                          ticket.sla_response_breached
                            ? "font-bold text-destructive"
                            : "font-medium"
                        }
                      >
                        {formatDateTime(ticket.sla_response_due_at)}
                      </span>
                    </div>
                    {ticket.sla_response_breached && (
                      <p className="text-xs text-destructive mt-0.5">Response SLA breached</p>
                    )}
                  </div>
                )}
                {ticket.sla_resolution_due_at && (
                  <div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Resolution Due</span>
                      <span
                        className={
                          ticket.sla_resolution_breached
                            ? "font-bold text-destructive"
                            : "font-medium"
                        }
                      >
                        {formatDateTime(ticket.sla_resolution_due_at)}
                      </span>
                    </div>
                    {ticket.sla_resolution_breached && (
                      <p className="text-xs text-destructive mt-0.5">Resolution SLA breached</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
