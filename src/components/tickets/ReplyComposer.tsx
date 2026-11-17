"use client";

import { useEffect, useImperativeHandle, useState, type Ref } from "react";
import { Loader2, Lock, Send } from "lucide-react";
import { toast } from "sonner";
import { RichTextEditor } from "@bengo-hub/shared-ui-lib/rich-text-editor";
import { Button } from "@/components/ui/base";
import { toPlainText } from "@/components/common/rich-text";
import { AiAdvisory, AiButton, AiCreditHint, AiError } from "@/components/ai/AiStatus";
import { appendHtml, plainToHtml } from "@/components/ai/html";
import { useAiAction } from "@/hooks/useAI";
import { suggestReply } from "@/lib/api/ai";
import { AttachmentDropzone } from "@/components/tickets/attachments/AttachmentDropzone";
import { MacroPicker } from "@/components/tickets/MacroPicker";
import { WhatsAppWindow } from "@/components/tickets/WhatsAppWindow";
import { mentionItems } from "@/components/tickets/mentions";
import { useAddComment } from "@/hooks/useTickets";
import { useUploadAttachment } from "@/hooks/useAttachments";
import { useLookups } from "@/hooks/useLookups";
import { cn } from "@/lib/utils";
import { useT } from "@/hooks/useT";

type Mode = "public" | "internal";

/** What the ticket page can do to the composer: add HTML, such as a suggested article link. */
export interface ReplyComposerHandle {
  insert: (html: string) => void;
}

/**
 * Reply box under the conversation. Staff choose between a public reply, which the customer sees,
 * and an internal note, which only staff see, and can apply a macro or @mention a colleague.
 * Customers can only reply publicly. Files dropped on the box go up after the reply, attached to
 * it; files sent without text go up on their own. While the box has focus and text, the parent
 * hears "typing" for the collision warning.
 *
 * With `aiReply`, staff can ask for a suggested reply. It fills the editor as a public reply and is
 * never sent on its own; the agent edits it and sends it like any reply.
 */
export function ReplyComposer({
  orgSlug,
  ticketId,
  allowInternal,
  allowMacros,
  allowAttachments,
  onTypingChange,
  whatsapp,
  aiReply,
  handleRef,
}: {
  orgSlug: string;
  ticketId: string;
  allowInternal: boolean;
  allowMacros: boolean;
  allowAttachments: boolean;
  onTypingChange?: (typing: boolean) => void;
  /** Set on a WhatsApp ticket for staff: the 24-hour window shows above a public reply. */
  whatsapp?: { windowExpiresAt: string | null; hasEmail: boolean };
  /** Set when the agent may ask for a suggested reply; `exempt` hides the credit hint. */
  aiReply?: { exempt: boolean };
  handleRef?: Ref<ReplyComposerHandle>;
}) {
  const { t } = useT();
  const { agents } = useLookups(orgSlug);
  const [mode, setMode] = useState<Mode>("public");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [filesInternal, setFilesInternal] = useState(false);
  const [focused, setFocused] = useState(false);
  const addComment = useAddComment(orgSlug, ticketId);
  const upload = useUploadAttachment(orgSlug, ticketId);
  const internal = allowInternal && mode === "internal";
  const empty = toPlainText(content) === "";
  const busy = addComment.isPending || upload.isPending;
  const typing = focused && !empty;

  useEffect(() => {
    onTypingChange?.(typing);
  }, [typing, onTypingChange]);

  useImperativeHandle(handleRef, () => ({ insert: (html: string) => setContent((prev) => appendHtml(prev, html)) }), []);

  // The suggested reply is customer-facing, so it lands in a public reply after any text already typed.
  const suggestion = useAiAction(
    (key) => suggestReply(orgSlug, ticketId, key),
    (data) => {
      setMode("public");
      setContent((prev) => appendHtml(prev, plainToHtml(data.reply)));
      toast.success(t("ai.reply.filled"));
    },
  );
  const suggested = suggestion.data;

  /** Uploads each file and reports the ones that did not go through. */
  const sendFiles = async (commentId?: string) => {
    const failed: string[] = [];
    for (const file of files) {
      try {
        await upload.mutateAsync({ file, opts: { commentId, internal: internal || (allowInternal && filesInternal) } });
      } catch {
        failed.push(file.name);
      }
    }
    if (failed.length) toast.error(t("attachments.uploadFailed", { names: failed.join(", ") }));
    else if (files.length) toast.success(t("attachments.uploaded", { n: files.length }));
    setFiles([]);
    setFilesInternal(false);
  };

  const submit = async () => {
    if (empty && files.length === 0) return;
    if (empty) {
      await sendFiles();
      return;
    }
    try {
      const comment = await addComment.mutateAsync({ content, comment_type: internal ? "internal" : "public" });
      setContent("");
      suggestion.reset();
      toast.success(internal ? t("ticket.noteAdded") : t("ticket.replySent"));
      if (files.length) await sendFiles(comment.id);
    } catch {
      toast.error(internal ? t("ticket.noteFailed") : t("ticket.replyFailed"));
    }
  };

  return (
    <section
      aria-label={t("ticket.reply")}
      className={cn(
        "rounded-xl border bg-card p-3 sm:p-4",
        internal ? "border-warning/50 bg-warning/5" : "border-border",
      )}
    >
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {allowInternal && (
          <div role="tablist" aria-label={t("ticket.replyType")} className="inline-flex self-start rounded-lg bg-muted p-1 text-sm">
            {(["public", "internal"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors",
                  mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m === "internal" && <Lock className="h-3.5 w-3.5" />}
                {m === "public" ? t("ticket.publicReply") : t("ticket.internalNote")}
              </button>
            ))}
          </div>
        )}
        {(allowMacros || aiReply) && (
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {aiReply && (
              <>
                <AiCreditHint credits={suggestion.isPending ? undefined : suggested?.credits} exempt={aiReply.exempt} />
                <AiButton pending={suggestion.isPending} onClick={suggestion.start} disabled={busy}>
                  {t("ai.reply.action")}
                </AiButton>
              </>
            )}
            {allowMacros && <MacroPicker orgSlug={orgSlug} ticketId={ticketId} disabled={busy} />}
          </div>
        )}
      </div>

      {aiReply && suggestion.failure && (
        <div className="mb-3">
          <AiError failure={suggestion.failure} onRetry={suggestion.retry} />
        </div>
      )}
      {aiReply && suggested && !suggestion.failure && (
        <div className="mb-3 space-y-2">
          <p className="text-xs text-muted-foreground">{t("ai.reply.editHint")}</p>
          <AiAdvisory notes={suggested.review_notes} tainted={suggested.tainted} stoppedEarly={suggested.run?.stopped_early} />
        </div>
      )}

      {whatsapp && !internal && (
        <div className="mb-3">
          <WhatsAppWindow expiresAt={whatsapp.windowExpiresAt} hasEmail={whatsapp.hasEmail} />
        </div>
      )}

      <div onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}>
        <RichTextEditor
          {...(allowInternal ? { mentions: mentionItems(agents) } : {})}
          value={content}
          onChange={setContent}
          placeholder={internal ? t("ticket.notePlaceholder") : t("ticket.replyPlaceholder")}
          ariaLabel={internal ? t("ticket.internalNote") : t("ticket.reply")}
          disabled={busy}
        />
      </div>

      {allowAttachments && (
        <div className="mt-3">
          <AttachmentDropzone
            files={files}
            onChange={setFiles}
            internal={internal || filesInternal}
            onInternalChange={allowInternal && !internal ? setFilesInternal : undefined}
            disabled={busy}
          />
        </div>
      )}

      <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {internal ? t("ticket.noteHint") : t("ticket.replyHint")}
        </p>
        <Button onClick={() => void submit()} disabled={(empty && files.length === 0) || busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {empty && files.length > 0 ? t("attachments.sendFiles") : internal ? t("ticket.addNote") : t("ticket.sendReply")}
        </Button>
      </div>
    </section>
  );
}
