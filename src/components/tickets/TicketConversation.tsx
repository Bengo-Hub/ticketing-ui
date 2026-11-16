"use client";

import { Bot, Lock, MessageSquare, User, UserCog } from "lucide-react";
import { RichTextView } from "@/components/common/rich-text";
import { LoadMore } from "@/components/common/load-more";
import { useT } from "@/hooks/useT";
import type { MessageKey } from "@/lib/i18n";
import { cn, formatDateTime, formatRelativeTime } from "@/lib/utils";
import type { AuthorType, Ticket, TicketComment } from "@/types/tickets";

const AUTHOR: Record<AuthorType, { label: MessageKey; icon: React.ElementType }> = {
  customer: { label: "ticket.authorCustomer", icon: User },
  agent: { label: "ticket.authorAgent", icon: UserCog },
  system: { label: "ticket.authorSystem", icon: Bot },
};

function CommentCard({ comment }: { comment: TicketComment }) {
  const { t } = useT();
  const internal = comment.comment_type === "internal";
  const system = comment.comment_type === "system";
  const author = AUTHOR[comment.author_type] ?? AUTHOR.system;
  const Icon = author.icon;

  if (system) {
    return (
      <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
        <Bot className="h-3.5 w-3.5 shrink-0" />
        <RichTextView value={comment.content} className="text-xs" />
        <span className="ml-auto shrink-0" title={formatDateTime(comment.created_at)}>
          {formatRelativeTime(comment.created_at)}
        </span>
      </div>
    );
  }

  return (
    <article
      className={cn(
        "rounded-xl border p-3 sm:p-4",
        internal
          ? "border-warning/40 border-l-4 border-l-warning bg-warning/5"
          : comment.author_type === "customer"
            ? "border-border bg-card"
            : "border-primary/20 bg-primary/5",
      )}
    >
      <header className="mb-2 flex flex-wrap items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </span>
        <span className="text-xs font-semibold">{t(author.label)}</span>
        {internal && (
          <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-semibold text-warning">
            <Lock className="h-3 w-3" /> {t("ticket.internalNote")}
          </span>
        )}
        <span className="ml-auto text-xs text-muted-foreground" title={formatDateTime(comment.created_at)}>
          {formatRelativeTime(comment.created_at)}
        </span>
      </header>
      <RichTextView value={comment.content} />
    </article>
  );
}

/**
 * The ticket's description followed by its replies, notes and system events, oldest first. The
 * API pages the thread from the start, so later replies load on request under the last one shown.
 */
export function TicketConversation({
  ticket,
  comments,
  loading,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}: {
  ticket: Ticket;
  comments: TicketComment[];
  loading?: boolean;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}) {
  const { t } = useT();
  const ordered = [...comments].sort((a, b) => a.created_at.localeCompare(b.created_at));
  return (
    <section className="space-y-3" aria-label={t("ticket.conversation")}>
      <article className="rounded-xl border border-border bg-card p-3 sm:p-4">
        <header className="mb-2 flex flex-wrap items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
          </span>
          <span className="text-xs font-semibold">{t("ticket.originalRequest")}</span>
          <span className="ml-auto text-xs text-muted-foreground" title={formatDateTime(ticket.created_at)}>
            {formatRelativeTime(ticket.created_at)}
          </span>
        </header>
        <RichTextView value={ticket.description} />
      </article>

      <h2 className="flex items-center gap-2 pt-1 text-sm font-semibold text-muted-foreground">
        <MessageSquare className="h-4 w-4" /> {t("ticket.repliesAndNotes", { n: hasMore ? `${comments.length}+` : comments.length })}
      </h2>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : ordered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
          {t("ticket.noReplies")}
        </p>
      ) : (
        ordered.map((c) => <CommentCard key={c.id} comment={c} />)
      )}

      {onLoadMore && (
        <LoadMore
          shown={comments.length}
          hasMore={hasMore}
          loading={loadingMore}
          onLoadMore={onLoadMore}
          label={t("ticket.laterReplies")}
        />
      )}
    </section>
  );
}
