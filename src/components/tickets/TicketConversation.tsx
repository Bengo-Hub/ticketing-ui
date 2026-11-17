"use client";

import { Bot, Lock, Mail, MessageCircle, MessageSquare, Send, User, UserCog } from "lucide-react";
import { RichTextView } from "@/components/common/rich-text";
import { LoadMore } from "@/components/common/load-more";
import { useT } from "@/hooks/useT";
import type { MessageKey } from "@/lib/i18n";
import { useTicketLabels } from "@/lib/ticket-options";
import { cn, formatDateTime, formatRelativeTime } from "@/lib/utils";
import type { AuthorType, CommentSender, Ticket, TicketChannel, TicketComment } from "@/types/tickets";

const AUTHOR: Record<AuthorType, { label: MessageKey; icon: React.ElementType }> = {
  customer: { label: "ticket.authorCustomer", icon: User },
  agent: { label: "ticket.authorAgent", icon: UserCog },
  system: { label: "ticket.authorSystem", icon: Bot },
};

/** The channels a customer message arrives on and an agent reply goes back by. */
const MESSAGE_CHANNEL_ICON: Partial<Record<TicketChannel, React.ElementType>> = {
  email: Mail,
  whatsapp: MessageCircle,
};

const MESSAGE_CHANNEL_CLASS: Partial<Record<TicketChannel, string>> = {
  email: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  whatsapp: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

/** "Amina Otieno <amina@example.com>", or whichever parts the message carried. */
function senderText(sender?: CommentSender): string {
  if (!sender) return "";
  const contact = sender.email || sender.phone || "";
  if (sender.name && contact) return `${sender.name} <${contact}>`;
  return sender.name || contact;
}

/**
 * How agent replies on an email or WhatsApp ticket go out. `replyEmail` is the requester's
 * email; WhatsApp replies are off by owner decision, so email is the only way out.
 */
interface Delivery {
  ticketChannel: TicketChannel;
  replyEmail: string;
}

function ChannelIcon({ channel, label }: { channel: TicketChannel; label: string }) {
  const Icon = MESSAGE_CHANNEL_ICON[channel];
  if (!Icon) return null;
  return (
    <span
      title={label}
      className={cn("flex h-7 w-7 items-center justify-center rounded-full", MESSAGE_CHANNEL_CLASS[channel])}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** The footer of an agent's public reply on an email or WhatsApp ticket: how it went out. */
function ReplyDelivery({ delivery }: { delivery: Delivery }) {
  const { t } = useT();
  const whatsapp = delivery.ticketChannel === "whatsapp";
  return (
    <p
      className="mt-2 flex items-center gap-1.5 border-t border-border/60 pt-2 text-[11px] text-muted-foreground"
      title={whatsapp ? t("ticket.whatsappRepliesOff") : undefined}
    >
      {delivery.replyEmail ? <Send className="h-3 w-3 shrink-0" /> : <Mail className="h-3 w-3 shrink-0" />}
      <span className="min-w-0 truncate">
        {delivery.replyEmail ? t("ticket.sentByEmail", { email: delivery.replyEmail }) : t("ticket.notSentNoEmail")}
      </span>
    </p>
  );
}

function CommentCard({ comment, delivery }: { comment: TicketComment; delivery?: Delivery }) {
  const { t } = useT();
  const labels = useTicketLabels();
  const internal = comment.comment_type === "internal";
  const system = comment.comment_type === "system";
  const author = AUTHOR[comment.author_type] ?? AUTHOR.system;
  const Icon = author.icon;
  // A customer message that came in by email or WhatsApp shows the channel and who wrote it.
  const channel = comment.channel && MESSAGE_CHANNEL_ICON[comment.channel] ? comment.channel : undefined;
  const sender = channel ? senderText(comment.sender) : "";
  const showDelivery = !!delivery && comment.author_type === "agent" && comment.comment_type === "public";

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
        {channel ? (
          <ChannelIcon channel={channel} label={t("ticket.receivedVia", { channel: labels.channel(channel) })} />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          </span>
        )}
        <span className="text-xs font-semibold">{t(author.label)}</span>
        {sender && <span className="min-w-0 truncate text-xs text-muted-foreground">{sender}</span>}
        {internal && (
          <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-semibold text-warning">
            <Lock className="h-3 w-3" /> {t("ticket.internalNote")}
          </span>
        )}
        <span className="ml-auto text-xs text-muted-foreground" title={formatDateTime(comment.created_at)}>
          {formatRelativeTime(comment.created_at)}
        </span>
      </header>
      {channel === "email" && comment.email_subject && (
        <blockquote className="mb-2 border-l-2 border-sky-300 pl-2 text-xs text-muted-foreground dark:border-sky-700">
          <span className="font-medium">{t("ticket.emailSubject")}:</span> {comment.email_subject}
        </blockquote>
      )}
      <RichTextView value={comment.content} />
      {showDelivery && delivery && <ReplyDelivery delivery={delivery} />}
    </article>
  );
}

const metaString = (meta: Record<string, unknown>, key: string): string | undefined =>
  typeof meta[key] === "string" && meta[key] ? (meta[key] as string) : undefined;

/**
 * The ticket's description followed by its replies, notes and system events, oldest first. The
 * API pages the thread from the start, so later replies load on request under the last one shown.
 * On an email or WhatsApp ticket, customer messages show the channel and sender, and agent replies
 * say how they went out (`replyEmail` is the requester's email, empty when there is none).
 */
export function TicketConversation({
  ticket,
  comments,
  replyEmail = "",
  showDelivery = false,
  loading,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}: {
  ticket: Ticket;
  comments: TicketComment[];
  replyEmail?: string;
  /** Staff see how each reply went out; the customer does not need it. */
  showDelivery?: boolean;
  loading?: boolean;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}) {
  const { t } = useT();
  const labels = useTicketLabels();
  const ordered = [...comments].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const channelTicket = !!MESSAGE_CHANNEL_ICON[ticket.channel];
  const delivery: Delivery | undefined =
    channelTicket && showDelivery ? { ticketChannel: ticket.channel, replyEmail } : undefined;
  const meta = ticket.metadata ?? {};
  // The message the ticket was opened from: its sender is the requester.
  const requester = channelTicket
    ? senderText({
        name: metaString(meta, "requester_name"),
        email: metaString(meta, "requester_email"),
        phone: metaString(meta, "requester_phone"),
      })
    : "";
  return (
    <section className="space-y-3" aria-label={t("ticket.conversation")}>
      <article className="rounded-xl border border-border bg-card p-3 sm:p-4">
        <header className="mb-2 flex flex-wrap items-center gap-2">
          {channelTicket ? (
            <ChannelIcon channel={ticket.channel} label={t("ticket.receivedVia", { channel: labels.channel(ticket.channel) })} />
          ) : (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
            </span>
          )}
          <span className="text-xs font-semibold">{t("ticket.originalRequest")}</span>
          {requester && <span className="min-w-0 truncate text-xs text-muted-foreground">{requester}</span>}
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
        ordered.map((c) => <CommentCard key={c.id} comment={c} delivery={delivery} />)
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
