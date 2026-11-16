"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { RichTextEditor } from "@bengo-hub/shared-ui-lib/rich-text-editor";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Label, Separator } from "@/components/ui/base";
import { supportError } from "@/components/support/code-step";
import { useT } from "@/hooks/useT";
import { useTicketLabels } from "@/lib/ticket-options";
import { formatDateTime } from "@/lib/utils";
import type { PublicTicketView } from "@/lib/api/public-support";

function statusVariant(status: string): "default" | "secondary" | "success" | "warning" | "outline" {
  switch (status) {
    case "resolved":
    case "closed":
      return "success";
    case "in_progress":
      return "default";
    case "pending_customer":
      return "warning";
    case "cancelled":
      return "secondary";
    default:
      return "outline";
  }
}

/**
 * The customer's view of one ticket on /support/track: its status and dates, and a reply box in
 * the shared RichTextEditor. The public view carries no conversation yet, so there are no stored
 * replies to show here.
 */
export function PublicTicketCard({
  orgName,
  ticketNumber,
  view,
  loading,
  loadError,
  email,
  reply,
  onReplyChange,
  replyEmpty,
  replyError,
  replySent,
  busy,
  onSubmit,
}: {
  orgName?: string;
  ticketNumber: string;
  view?: PublicTicketView;
  loading: boolean;
  /** A load error other than an expired access token, which the page handles itself. */
  loadError: unknown;
  email: string;
  reply: string;
  onReplyChange: (html: string) => void;
  replyEmpty: boolean;
  replyError: string | null;
  replySent: boolean;
  busy: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const { t } = useT();
  const labels = useTicketLabels();
  // The customer reads the two pending states from their own side.
  const statusText = (s: string) =>
    s === "pending_customer" ? t("support.waitingForYou") : s === "pending_internal" ? t("support.beingWorkedOn") : labels.status(s);
  const [byEmailBefore, byEmailAfter] = t("support.replyByEmail", { email: "\u0000" }).split("\u0000");

  return (
    <Card>
      <CardHeader>
        <CardDescription>{orgName ? t("support.orgSupport", { org: orgName }) : t("support.support")}</CardDescription>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <span className="font-mono">{ticketNumber}</span>
          {view && <Badge variant={statusVariant(view.status)}>{statusText(view.status)}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {loading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> {t("support.loadingTicket")}
          </p>
        )}
        {!!loadError && (
          <p role="alert" className="text-sm text-destructive">
            {supportError(loadError, t, t("support.ticketLoadFailed"))}
          </p>
        )}
        {view && (
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <div className="min-w-0 sm:col-span-3">
              <dt className="text-muted-foreground">{t("support.subject")}</dt>
              <dd className="font-medium wrap-break-word">{view.subject}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("support.opened")}</dt>
              <dd>{formatDateTime(view.created_at)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("support.lastUpdate")}</dt>
              <dd>{formatDateTime(view.updated_at)}</dd>
            </div>
          </dl>
        )}

        <Separator />

        <form onSubmit={onSubmit} className="space-y-3">
          <div className="min-w-0 space-y-1">
            <Label id="reply-label">{t("support.addReply")}</Label>
            <RichTextEditor
              value={reply}
              onChange={onReplyChange}
              placeholder={t("support.replyPlaceholder")}
              ariaLabelledBy="reply-label"
              ariaDescribedBy="reply-help"
              disabled={busy}
            />
            <p id="reply-help" className="text-xs text-muted-foreground wrap-break-word">
              {byEmailBefore}
              <span className="font-medium text-foreground">{email}</span>
              {byEmailAfter}
            </p>
          </div>
          {replyError && (
            <p role="alert" className="text-sm text-destructive">
              {replyError}
            </p>
          )}
          {replySent && (
            <p role="status" className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" /> {t("support.replyAdded")}
            </p>
          )}
          <Button type="submit" disabled={busy || replyEmpty}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("support.sendReply")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
