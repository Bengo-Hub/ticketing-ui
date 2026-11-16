"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GitMerge, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FormSheet } from "@/components/common/form-sheet";
import { Field } from "@/components/common/field";
import { Button } from "@/components/ui/base";
import { TicketPicker } from "@/components/tickets/TicketPicker";
import { useMergeTicket } from "@/hooks/useTickets";
import { useT } from "@/hooks/useT";
import { orgRoute } from "@/lib/utils";
import type { Ticket } from "@/types/tickets";

const statusOf = (err: unknown) => (err as { response?: { status?: number } })?.response?.status;

/**
 * Merges this ticket into another. The API moves the replies and files, closes this ticket and
 * notes the merge on both; the agent then lands on the ticket that carries on.
 */
export function MergeDialog({
  orgSlug,
  ticket,
  open,
  onOpenChange,
}: {
  orgSlug: string;
  ticket: Ticket;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useT();
  const router = useRouter();
  const merge = useMergeTicket(orgSlug, ticket.id);
  const [targetId, setTargetId] = useState("");
  const [targetLabel, setTargetLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!targetId) return setError(t("merge.pickFirst"));
    setError(null);
    try {
      const target = await merge.mutateAsync(targetId);
      toast.success(t("merge.done", { number: target.ticket_number }));
      onOpenChange(false);
      router.push(orgRoute(orgSlug, `/tickets/${target.id}`));
    } catch (err) {
      // 409 covers every state conflict: already merged, or either ticket closed.
      setError(statusOf(err) === 409 ? t("merge.conflict") : t("merge.failed"));
    }
  };

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      title={t("merge.title", { number: ticket.ticket_number })}
      description={t("merge.description")}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={merge.isPending}>
            {t("common.cancel")}
          </Button>
          <Button onClick={() => void submit()} disabled={!targetId || merge.isPending}>
            {merge.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitMerge className="h-4 w-4" />}
            {t("merge.confirm")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label={t("merge.into")} required error={error ?? undefined} hint={t("merge.searchHint")}>
          <TicketPicker
            orgSlug={orgSlug}
            excludeId={ticket.id}
            value={targetId}
            valueLabel={targetLabel}
            onChange={(id, option) => {
              setTargetId(id);
              setTargetLabel(option?.label ?? "");
              setError(null);
            }}
            disabled={merge.isPending}
          />
        </Field>
        {targetId && (
          <p className="rounded-lg border border-warning/40 bg-warning/5 p-3 text-sm">
            {t("merge.warning", { number: ticket.ticket_number, target: targetLabel })}
          </p>
        )}
      </div>
    </FormSheet>
  );
}
