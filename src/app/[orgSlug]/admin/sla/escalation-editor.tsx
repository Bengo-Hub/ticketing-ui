"use client";

import { useMemo } from "react";
import { Plus, X } from "lucide-react";
import { SearchableCombobox, type ComboboxOption } from "@bengo-hub/shared-ui-lib/combobox";
import { Button, Input } from "@/components/ui/base";
import { useT } from "@/hooks/useT";
import { MAX_ESCALATION_RULES, MAX_LEAD_MINUTES } from "@/lib/sla";
import type { EscalationRule, EscalationWhen, SLATarget } from "@/types/sla";

/** An escalation rule as typed, minutes still text so a half-typed number is not lost. */
export interface RuleDraft {
  target: SLATarget;
  when: EscalationWhen;
  minutes: string;
  raise_priority: boolean;
  team_id: string;
}

export function draftRule(r?: EscalationRule): RuleDraft {
  return {
    target: r?.target ?? "resolution",
    when: r?.when ?? "after_breach",
    minutes: String(r?.minutes ?? 0),
    raise_priority: r?.raise_priority ?? !r?.team_id,
    team_id: r?.team_id ?? "",
  };
}

/** The rule to send, or a reason it cannot be sent. Mirrors clock.EscalationRule.validate. */
export function ruleFromDraft(d: RuleDraft): EscalationRule | "minutes" | "action" {
  const minutes = /^\d+$/.test(d.minutes.trim()) ? Number(d.minutes) : NaN;
  if (!(minutes >= 0 && minutes <= MAX_LEAD_MINUTES)) return "minutes";
  if (!d.raise_priority && !d.team_id) return "action";
  return { target: d.target, when: d.when, minutes, raise_priority: d.raise_priority, team_id: d.team_id || undefined };
}

/**
 * The escalation ladder of a policy. Rule n fires for a ticket at escalation level n once its
 * target's deadline, moved by the minutes before or after, has passed.
 */
export function EscalationEditor({
  rules,
  onChange,
  teamOptions,
}: {
  rules: RuleDraft[];
  onChange: (rules: RuleDraft[]) => void;
  teamOptions: ComboboxOption[];
}) {
  const { t } = useT();
  const targetOptions = useMemo<ComboboxOption[]>(
    () => [
      { value: "first_response", label: t("slaPolicies.targetFirstResponse") },
      { value: "resolution", label: t("slaPolicies.targetResolution") },
    ],
    [t],
  );
  const whenOptions = useMemo<ComboboxOption[]>(
    () => [
      { value: "before_breach", label: t("slaPolicies.whenBefore") },
      { value: "after_breach", label: t("slaPolicies.whenAfter") },
    ],
    [t],
  );
  const patch = (i: number, next: Partial<RuleDraft>) => onChange(rules.map((r, j) => (j === i ? { ...r, ...next } : r)));

  return (
    <fieldset className="space-y-2">
      <legend className="mb-1 text-sm font-medium">{t("slaPolicies.escalationTitle")}</legend>
      <p className="text-xs text-muted-foreground">{t("slaPolicies.escalationHint")}</p>
      {rules.map((r, i) => (
        <div key={i} className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("slaPolicies.levelN", { n: i + 1 })}
            </span>
            <button
              type="button"
              onClick={() => onChange(rules.filter((_, j) => j !== i))}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label={t("slaPolicies.removeRule", { n: i + 1 })}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_6rem_minmax(0,1fr)]">
            <SearchableCombobox
              options={targetOptions}
              value={r.target}
              onChange={(v) => v && patch(i, { target: v as SLATarget })}
              clearable={false}
            />
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              max={MAX_LEAD_MINUTES}
              value={r.minutes}
              onChange={(e) => patch(i, { minutes: e.target.value })}
              aria-label={t("slaPolicies.ruleMinutes")}
            />
            <SearchableCombobox
              options={whenOptions}
              value={r.when}
              onChange={(v) => v && patch(i, { when: v as EscalationWhen })}
              clearable={false}
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-border px-3 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={r.raise_priority}
                onChange={(e) => patch(i, { raise_priority: e.target.checked })}
              />
              {t("slaPolicies.raisePriority")}
            </label>
            <SearchableCombobox
              options={teamOptions}
              value={r.team_id}
              onChange={(v) => patch(i, { team_id: v })}
              placeholder={t("slaPolicies.noTeamChange")}
              emptyText={t("slaPolicies.noTeams")}
            />
          </div>
        </div>
      ))}
      {rules.length < MAX_ESCALATION_RULES ? (
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...rules, draftRule()])}>
          <Plus className="h-4 w-4" /> {t("slaPolicies.addRule")}
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">{t("slaPolicies.maxRules", { n: MAX_ESCALATION_RULES })}</p>
      )}
    </fieldset>
  );
}
