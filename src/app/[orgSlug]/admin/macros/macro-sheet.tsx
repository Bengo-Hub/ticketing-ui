"use client";

import { useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { SearchableCombobox, type ComboboxOption } from "@bengo-hub/shared-ui-lib/combobox";
import { RichTextEditor } from "@bengo-hub/shared-ui-lib/rich-text-editor";
import { FormSheet } from "@/components/common/form-sheet";
import { Field, SwitchField } from "@/components/common/field";
import { toPlainText } from "@/components/common/rich-text";
import { Button, Input } from "@/components/ui/base";
import { useLookups } from "@/hooks/useLookups";
import { useSaveMacro } from "@/hooks/useMacros";
import { useTicketTags } from "@/hooks/useTickets";
import { useT } from "@/hooks/useT";
import { useTicketLabels } from "@/lib/ticket-options";
import type { TicketPriority, TicketStatus } from "@/types/tickets";
import type { Macro, MacroActions } from "@/types/workspace";

/** The placeholders the API fills in a macro body. */
const PLACEHOLDERS = ["{{ticket_number}}", "{{subject}}", "{{requester_name}}"];

/** Creates or edits a macro: its reply body and the field changes it makes. */
export function MacroSheet({
  orgSlug,
  macro,
  open,
  onOpenChange,
}: {
  orgSlug: string;
  macro: Macro | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useT();
  const labels = useTicketLabels();
  const { agentOptions, teamOptions, categoryOptions } = useLookups(orgSlug);
  const tagList = useTicketTags(orgSlug);
  const save = useSaveMacro(orgSlug);
  const [name, setName] = useState(macro?.name ?? "");
  const [body, setBody] = useState(macro?.body ?? "");
  const [actions, setActions] = useState<MacroActions>(macro?.actions ?? {});
  const [active, setActive] = useState(macro?.is_active ?? true);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof MacroActions>(k: K, v: MacroActions[K]) => setActions((a) => ({ ...a, [k]: v || undefined }));
  const tags = actions.add_tags ?? [];

  const tagOptions = useMemo<ComboboxOption[]>(
    () => (tagList.data ?? []).filter((tc) => !tags.includes(tc.tag)).map((tc) => ({ value: tc.tag, label: tc.tag })),
    [tagList.data, tags],
  );
  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase();
    if (tag && !tags.includes(tag)) set("add_tags", [...tags, tag]);
  };

  const submit = async () => {
    const trimmed = name.trim();
    const hasAction = !!(actions.status || actions.priority || actions.category_id || actions.team_id || actions.agent_id || tags.length);
    if (!trimmed || trimmed.length > 100) return setError(t("macros.nameRequired"));
    if (!toPlainText(body) && !hasAction) return setError(t("macros.needsSomething"));
    setError(null);
    try {
      await save.mutateAsync({
        id: macro?.id,
        data: { name: trimmed, body: toPlainText(body) ? body : "", actions, is_active: active },
      });
      toast.success(macro ? t("macros.updated") : t("macros.created"));
      onOpenChange(false);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(status === 409 ? t("macros.nameTaken") : t("macros.saveFailed"));
    }
  };

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={macro ? t("macros.editNamed", { name: macro.name }) : t("macros.newTitle")}
      description={t("macros.sheetHint")}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
            {t("common.cancel")}
          </Button>
          <Button onClick={() => void submit()} disabled={save.isPending}>
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {macro ? t("common.saveChanges") : t("macros.create")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label={t("macros.colName")} htmlFor="macro-name" required>
          <Input id="macro-name" value={name} maxLength={100} onChange={(e) => setName(e.target.value)} placeholder={t("macros.namePlaceholder")} />
        </Field>
        <Field label={t("macros.body")} hint={t("macros.bodyHint", { fields: PLACEHOLDERS.join(", ") })}>
          <RichTextEditor value={body} onChange={setBody} placeholder={t("macros.bodyPlaceholder")} ariaLabel={t("macros.body")} />
        </Field>
        <SwitchField
          label={t("macros.asNoteLabel")}
          description={t("macros.asNoteHint")}
          checked={actions.comment_type === "internal"}
          onChange={(v) => set("comment_type", v ? "internal" : undefined)}
        />

        <fieldset className="space-y-3 rounded-lg border border-border p-3">
          <legend className="px-1 text-sm font-semibold">{t("macros.changes")}</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t("macros.fieldStatus")}>
              <SearchableCombobox options={labels.statusOptions} value={actions.status ?? ""} onChange={(v) => set("status", v as TicketStatus)} placeholder={t("macros.noChange")} />
            </Field>
            <Field label={t("macros.fieldPriority")}>
              <SearchableCombobox options={labels.priorityOptions} value={actions.priority ?? ""} onChange={(v) => set("priority", v as TicketPriority)} placeholder={t("macros.noChange")} />
            </Field>
            <Field label={t("ticket.category")}>
              <SearchableCombobox options={categoryOptions} value={actions.category_id ?? ""} onChange={(v) => set("category_id", v)} placeholder={t("macros.noChange")} emptyText={t("ticket.noCategories")} />
            </Field>
            <Field label={t("ticket.team")}>
              <SearchableCombobox options={teamOptions} value={actions.team_id ?? ""} onChange={(v) => set("team_id", v)} placeholder={t("macros.noChange")} emptyText={t("ticket.noTeams")} />
            </Field>
            <Field label={t("ticket.assignee")} className="sm:col-span-2">
              <SearchableCombobox options={agentOptions} value={actions.agent_id ?? ""} onChange={(v) => set("agent_id", v)} placeholder={t("macros.noChange")} emptyText={t("ticket.noAgents")} />
            </Field>
            <Field label={t("macros.fieldTags")} className="sm:col-span-2">
              <div className="space-y-2">
                {tags.length > 0 && (
                  <ul className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <li key={tag} className="flex items-center gap-1 rounded-full bg-secondary py-0.5 pl-2.5 pr-1 text-xs">
                        <span className="max-w-40 truncate">{tag}</span>
                        <button
                          type="button"
                          onClick={() => set("add_tags", tags.filter((x) => x !== tag))}
                          aria-label={t("tags.remove", { tag })}
                          className="rounded-full p-0.5 hover:bg-background"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <SearchableCombobox
                  options={tagOptions}
                  value=""
                  onChange={(v) => v && addTag(v)}
                  onCreate={(text) => addTag(text)}
                  createLabel={t("tags.addNew")}
                  placeholder={t("tags.add")}
                  searchPlaceholder={t("tags.search")}
                  emptyText={t("tags.none")}
                />
              </div>
            </Field>
          </div>
        </fieldset>

        <SwitchField label={t("macros.active")} description={t("macros.activeHint")} checked={active} onChange={setActive} />
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    </FormSheet>
  );
}
