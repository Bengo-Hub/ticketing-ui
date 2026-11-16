"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, WandSparkles, X } from "lucide-react";
import { toast } from "sonner";
import { SearchableCombobox, type ComboboxOption } from "@bengo-hub/shared-ui-lib/combobox";
import { toPlainText } from "@/components/common/rich-text";
import { useApplyMacro, useMacros } from "@/hooks/useMacros";
import { useT } from "@/hooks/useT";
import { useTicketLabels } from "@/lib/ticket-options";
import type { Macro, MacroApplied } from "@/types/workspace";

const statusOf = (err: unknown) => (err as { response?: { status?: number } })?.response?.status;

/**
 * Applies a macro to the ticket from the composer. The API makes the macro's field changes and
 * posts its body as a reply in one step; the outcome stays under the picker until dismissed.
 */
export function MacroPicker({ orgSlug, ticketId, disabled }: { orgSlug: string; ticketId: string; disabled?: boolean }) {
  const { t } = useT();
  const labels = useTicketLabels();
  const { data: macros = [] } = useMacros(orgSlug, true);
  const apply = useApplyMacro(orgSlug, ticketId);
  const [result, setResult] = useState<{ macro: Macro; res: MacroApplied } | null>(null);

  const options = useMemo<ComboboxOption[]>(
    () => macros.map((m) => ({ value: m.id, label: m.name, description: toPlainText(m.body).slice(0, 80) || undefined })),
    [macros],
  );

  const run = async (id: string) => {
    const macro = macros.find((m) => m.id === id);
    if (!macro) return;
    try {
      const res = await apply.mutateAsync(id);
      setResult({ macro, res });
      toast.success(t("macros.applied", { name: macro.name }));
    } catch (err) {
      toast.error(statusOf(err) === 400 || statusOf(err) === 409 ? t("macros.cannotApply") : t("macros.applyFailed"));
    }
  };

  const summary = (r: { macro: Macro; res: MacroApplied }) => {
    const a = r.macro.actions;
    const parts: string[] = [];
    if (a.status) parts.push(t("macros.didStatus", { status: labels.status(r.res.ticket.status) }));
    if (a.priority) parts.push(t("macros.didPriority", { priority: labels.priority(r.res.ticket.priority) }));
    if (a.agent_id || a.team_id) parts.push(t("macros.didAssign"));
    if (a.category_id) parts.push(t("macros.didCategory"));
    if (a.add_tags?.length) parts.push(t("macros.didTags", { tags: a.add_tags.join(", ") }));
    if (r.res.comment) parts.push(r.res.comment.comment_type === "internal" ? t("macros.didNote") : t("macros.didReply"));
    return parts.join(" · ");
  };

  if (options.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <WandSparkles className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <SearchableCombobox
          options={options}
          value=""
          onChange={(v) => v && void run(v)}
          placeholder={apply.isPending ? t("macros.applying") : t("macros.pick")}
          searchPlaceholder={t("macros.search")}
          emptyText={t("macros.none")}
          disabled={disabled || apply.isPending}
          className="min-w-0 flex-1 sm:max-w-xs"
        />
      </div>
      {result && (
        <p className="flex items-start gap-2 rounded-lg bg-success/10 px-3 py-2 text-xs text-success">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="font-semibold">{result.macro.name}</span>: {summary(result) || t("macros.didNothing")}
          </span>
          <button
            type="button"
            onClick={() => setResult(null)}
            aria-label={t("common.close")}
            className="rounded p-0.5 hover:bg-success/10"
          >
            <X className="h-3 w-3" />
          </button>
        </p>
      )}
    </div>
  );
}
