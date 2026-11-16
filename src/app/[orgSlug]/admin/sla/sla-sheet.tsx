"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SearchableCombobox, type ComboboxOption } from "@bengo-hub/shared-ui-lib/combobox";
import { FormSheet } from "@/components/common/form-sheet";
import { Field, SwitchField } from "@/components/common/field";
import { Button, Input } from "@/components/ui/base";
import { useCreateSLAPolicy, useUpdateSLAPolicy } from "@/hooks/useSLA";
import { useT } from "@/hooks/useT";
import { formatMinutes, MAX_LEAD_MINUTES, readSettings, writeSettings } from "@/lib/sla";
import { useTicketLabels } from "@/lib/ticket-options";
import type { TicketPriority } from "@/types/tickets";
import type { BusinessCalendar, EscalationRule, SLAPolicy } from "@/types/sla";
import { draftRule, EscalationEditor, ruleFromDraft, type RuleDraft } from "./escalation-editor";

/** The picker value that stands for "no calendar", every minute counts. */
const CLOCK_24X7 = "24x7";

interface Draft {
  name: string;
  description: string;
  priority: TicketPriority;
  category_id: string;
  calendar: string;
  first_response_minutes: string;
  resolution_minutes: string;
  notify_before: string;
  pause_internal: boolean;
  rules: RuleDraft[];
  sort_order: string;
  is_active: boolean;
}

function draftFrom(p: SLAPolicy | null, calendars: BusinessCalendar[]): Draft {
  const s = readSettings(p?.metadata);
  const fallback = calendars.find((c) => c.is_default)?.id ?? CLOCK_24X7;
  return {
    name: p?.name ?? "",
    description: p?.description ?? "",
    priority: p?.priority ?? "normal",
    category_id: p?.category_id ?? "",
    calendar: p ? (p.calendar_id ?? CLOCK_24X7) : fallback,
    first_response_minutes: String(p?.first_response_minutes ?? 60),
    resolution_minutes: String(p?.resolution_minutes ?? 480),
    notify_before: String(s.notifyBeforeBreachMin),
    pause_internal: s.pauseOnPendingInternal,
    rules: s.escalationRules.map(draftRule),
    sort_order: String(p?.sort_order ?? 0),
    is_active: p?.is_active ?? true,
  };
}

const whole = (v: string) => (/^\d+$/.test(v.trim()) ? Number(v) : NaN);

export function SLASheet({
  orgSlug,
  policy,
  open,
  onOpenChange,
  categoryOptions,
  teamOptions,
  calendars,
}: {
  orgSlug: string;
  policy: SLAPolicy | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryOptions: ComboboxOption[];
  teamOptions: ComboboxOption[];
  calendars: BusinessCalendar[];
}) {
  const { t } = useT();
  const [d, setD] = useState<Draft>(() => draftFrom(policy, calendars));
  const [error, setError] = useState<string | null>(null);
  const labels = useTicketLabels();
  const create = useCreateSLAPolicy(orgSlug);
  const update = useUpdateSLAPolicy(orgSlug);
  const pending = create.isPending || update.isPending;
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));

  const calendarOptions = useMemo<ComboboxOption[]>(
    () => [
      { value: CLOCK_24X7, label: t("slaPolicies.clock24x7"), description: t("slaPolicies.clock24x7Hint") },
      ...calendars.map((c) => ({
        value: c.id,
        label: c.name,
        hint: c.is_default ? t("slaCalendars.default") : undefined,
        description: c.timezone,
      })),
    ],
    [calendars, t],
  );

  const save = async () => {
    setError(null);
    const first = whole(d.first_response_minutes);
    const resolution = whole(d.resolution_minutes);
    const sort = whole(d.sort_order || "0");
    const notify = whole(d.notify_before || "0");
    if (d.name.trim().length < 2) return setError(t("slaPolicies.nameRequired"));
    if (!(first > 0) || !(resolution > 0)) return setError(t("slaPolicies.targetsRequired"));
    if (resolution < first) return setError(t("slaPolicies.resolutionShorter"));
    if (!(notify >= 0 && notify <= MAX_LEAD_MINUTES)) return setError(t("slaPolicies.notifyRange", { max: MAX_LEAD_MINUTES }));
    if (Number.isNaN(sort)) return setError(t("slaPolicies.orderWhole"));
    const rules: EscalationRule[] = [];
    for (const [i, r] of d.rules.entries()) {
      const rule = ruleFromDraft(r);
      if (rule === "minutes") return setError(t("slaPolicies.ruleMinutesRange", { n: i + 1, max: MAX_LEAD_MINUTES }));
      if (rule === "action") return setError(t("slaPolicies.ruleNeedsAction", { n: i + 1 }));
      rules.push(rule);
    }
    const metadata = writeSettings(policy?.metadata, {
      notifyBeforeBreachMin: notify,
      pauseOnPendingInternal: d.pause_internal,
      escalationRules: rules,
    });
    const calendarId = d.calendar === CLOCK_24X7 ? undefined : d.calendar;
    const payload = {
      name: d.name.trim(),
      description: d.description.trim(),
      priority: d.priority,
      category_id: d.category_id || undefined,
      first_response_minutes: first,
      resolution_minutes: resolution,
      sort_order: sort,
      metadata,
    };
    try {
      if (policy) {
        await update.mutateAsync({
          id: policy.id,
          data: { ...payload, is_active: d.is_active, calendar_id: calendarId, clear_calendar: !calendarId },
        });
        toast.success(t("slaPolicies.updated"));
      } else {
        await create.mutateAsync({ ...payload, description: payload.description || undefined, calendar_id: calendarId });
        toast.success(t("slaPolicies.created"));
      }
      onOpenChange(false);
    } catch {
      setError(t("slaPolicies.saveFailed"));
    }
  };

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={policy ? t("slaPolicies.editNamed", { name: policy.name }) : t("slaPolicies.newTitle")}
      description={t("slaPolicies.sheetHint")}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            {t("common.cancel")}
          </Button>
          <Button onClick={() => void save()} disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {policy ? t("common.saveChanges") : t("slaPolicies.create")}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("slaPolicies.name")} htmlFor="sla-name" required className="sm:col-span-2">
            <Input
              id="sla-name"
              value={d.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder={t("slaPolicies.namePlaceholder")}
            />
          </Field>
          <Field label={t("slaPolicies.description")} htmlFor="sla-desc" className="sm:col-span-2">
            <Input id="sla-desc" value={d.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <Field label={t("slaPolicies.colPriority")} required>
            <SearchableCombobox
              options={labels.priorityOptions}
              value={d.priority}
              onChange={(v) => v && set("priority", v as TicketPriority)}
              clearable={false}
            />
          </Field>
          <Field label={t("slaPolicies.colCategory")} hint={t("slaPolicies.categoryHint")}>
            <SearchableCombobox
              options={categoryOptions}
              value={d.category_id}
              onChange={(v) => set("category_id", v)}
              placeholder={t("slaPolicies.anyCategory")}
              emptyText={t("slaPolicies.noCategories")}
            />
          </Field>
          <Field
            label={t("slaPolicies.firstResponseMinutes")}
            htmlFor="sla-first"
            required
            hint={formatMinutes(whole(d.first_response_minutes) || 0, t)}
          >
            <Input
              id="sla-first"
              type="number"
              inputMode="numeric"
              min={1}
              value={d.first_response_minutes}
              onChange={(e) => set("first_response_minutes", e.target.value)}
            />
          </Field>
          <Field
            label={t("slaPolicies.resolutionMinutes")}
            htmlFor="sla-res"
            required
            hint={formatMinutes(whole(d.resolution_minutes) || 0, t)}
          >
            <Input
              id="sla-res"
              type="number"
              inputMode="numeric"
              min={1}
              value={d.resolution_minutes}
              onChange={(e) => set("resolution_minutes", e.target.value)}
            />
          </Field>
          <Field label={t("slaPolicies.calendar")} hint={t("slaPolicies.calendarHint")} className="sm:col-span-2">
            <SearchableCombobox
              options={calendarOptions}
              value={d.calendar}
              valueLabel={t("slaPolicies.calendarMissing")}
              onChange={(v) => v && set("calendar", v)}
              clearable={false}
            />
          </Field>
          <Field
            label={t("slaPolicies.notifyBefore")}
            htmlFor="sla-notify"
            hint={
              whole(d.notify_before) > 0
                ? t("slaPolicies.notifyBeforeHint", { duration: formatMinutes(whole(d.notify_before), t) })
                : t("slaPolicies.notifyOff")
            }
          >
            <Input
              id="sla-notify"
              type="number"
              inputMode="numeric"
              min={0}
              max={MAX_LEAD_MINUTES}
              value={d.notify_before}
              onChange={(e) => set("notify_before", e.target.value)}
            />
          </Field>
          <Field label={t("slaPolicies.order")} htmlFor="sla-order" hint={t("slaPolicies.orderHint")}>
            <Input
              id="sla-order"
              type="number"
              inputMode="numeric"
              min={0}
              value={d.sort_order}
              onChange={(e) => set("sort_order", e.target.value)}
            />
          </Field>
        </div>
        <SwitchField
          label={t("slaPolicies.pauseInternal")}
          description={t("slaPolicies.pauseInternalHint")}
          checked={d.pause_internal}
          onChange={(v) => set("pause_internal", v)}
        />
        <EscalationEditor rules={d.rules} onChange={(rules) => set("rules", rules)} teamOptions={teamOptions} />
        {policy && (
          <SwitchField
            label={t("slaPolicies.active")}
            description={t("slaPolicies.activeHint")}
            checked={d.is_active}
            onChange={(v) => set("is_active", v)}
          />
        )}
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    </FormSheet>
  );
}
