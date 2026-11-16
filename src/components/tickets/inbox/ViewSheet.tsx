"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FormSheet } from "@/components/common/form-sheet";
import { Field, SwitchField } from "@/components/common/field";
import { Button, Input } from "@/components/ui/base";
import { useSaveView } from "@/hooks/useViews";
import { useT } from "@/hooks/useT";
import type { TicketView, ViewInput } from "@/types/workspace";

/**
 * Names a view, and for people with tickets.manage, shares it with the whole team. A new view
 * takes the filters on screen; renaming an existing one keeps its own filters.
 */
export function ViewSheet({
  orgSlug,
  view,
  current,
  canShare,
  open,
  onOpenChange,
  onSaved,
}: {
  orgSlug: string;
  /** The view being renamed, or null for a new one. */
  view: TicketView | null;
  /** Filters and order a new view saves. */
  current: Omit<ViewInput, "name" | "shared">;
  canShare: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (view: TicketView) => void;
}) {
  const { t } = useT();
  const [name, setName] = useState(view?.name ?? "");
  const [shared, setShared] = useState(view?.shared ?? false);
  const [error, setError] = useState<string | null>(null);
  const save = useSaveView(orgSlug);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return setError(t("views.nameRequired"));
    if (trimmed.length > 100) return setError(t("views.nameTooLong"));
    setError(null);
    const data: ViewInput = view
      ? { name: trimmed, filters: view.filters ?? {}, sort: view.sort, shared: canShare ? shared : view.shared }
      : { ...current, name: trimmed, shared: canShare && shared };
    try {
      const saved = await save.mutateAsync({ id: view?.id, data });
      toast.success(view ? t("views.renamed") : t("views.saved"));
      onSaved?.(saved);
      onOpenChange(false);
    } catch {
      setError(t("views.saveFailed"));
    }
  };

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      title={view ? t("views.renameTitle") : t("views.saveTitle")}
      description={view ? undefined : t("views.saveHint")}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
            {t("common.cancel")}
          </Button>
          <Button onClick={() => void submit()} disabled={save.isPending}>
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("common.save")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label={t("views.name")} htmlFor="view-name" required error={error ?? undefined}>
          <Input
            id="view-name"
            value={name}
            maxLength={100}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void submit()}
            placeholder={t("views.namePlaceholder")}
          />
        </Field>
        {canShare && (
          <SwitchField label={t("views.shareLabel")} description={t("views.shareHint")} checked={shared} onChange={setShared} />
        )}
      </div>
    </FormSheet>
  );
}
