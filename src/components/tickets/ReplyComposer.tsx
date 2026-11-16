"use client";

import { useState } from "react";
import { Loader2, Lock, Send } from "lucide-react";
import { toast } from "sonner";
import { RichTextEditor } from "@bengo-hub/shared-ui-lib/rich-text-editor";
import { Button } from "@/components/ui/base";
import { toPlainText } from "@/components/common/rich-text";
import { useAddComment } from "@/hooks/useTickets";
import { cn } from "@/lib/utils";

type Mode = "public" | "internal";

/**
 * Reply box under the conversation. Staff choose between a public reply, which the customer sees,
 * and an internal note, which only staff see. Customers can only reply publicly.
 */
export function ReplyComposer({
  orgSlug,
  ticketId,
  allowInternal,
}: {
  orgSlug: string;
  ticketId: string;
  allowInternal: boolean;
}) {
  const [mode, setMode] = useState<Mode>("public");
  const [content, setContent] = useState("");
  const addComment = useAddComment(orgSlug, ticketId);
  const internal = allowInternal && mode === "internal";
  const empty = toPlainText(content) === "";

  const submit = async () => {
    if (empty) return;
    try {
      await addComment.mutateAsync({ content, comment_type: internal ? "internal" : "public" });
      setContent("");
      toast.success(internal ? "Internal note added" : "Reply sent");
    } catch {
      toast.error(internal ? "The note could not be saved." : "The reply could not be sent.");
    }
  };

  return (
    <section
      aria-label="Reply"
      className={cn(
        "rounded-xl border bg-card p-3 sm:p-4",
        internal ? "border-warning/50 bg-warning/5" : "border-border",
      )}
    >
      {allowInternal && (
        <div role="tablist" aria-label="Reply type" className="mb-3 inline-flex rounded-lg bg-muted p-1 text-sm">
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
              {m === "public" ? "Public reply" : "Internal note"}
            </button>
          ))}
        </div>
      )}

      <RichTextEditor
        value={content}
        onChange={setContent}
        placeholder={internal ? "Write a note only staff can see" : "Write a reply to the customer"}
        ariaLabel={internal ? "Internal note" : "Reply"}
        disabled={addComment.isPending}
      />

      <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {internal ? "Only your team sees internal notes." : "The customer sees public replies."}
        </p>
        <Button onClick={() => void submit()} disabled={empty || addComment.isPending}>
          {addComment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {internal ? "Add note" : "Send reply"}
        </Button>
      </div>
    </section>
  );
}
