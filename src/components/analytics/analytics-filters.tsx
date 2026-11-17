"use client";

import { SearchableCombobox } from "@bengo-hub/shared-ui-lib/combobox";
import { Field } from "@/components/common/field";
import { Input } from "@/components/ui/base";
import { useLookups } from "@/hooks/useLookups";
import type { Translate } from "@/lib/i18n";
import { lastDays } from "@/lib/analytics";
import { useTicketLabels } from "@/lib/ticket-options";
import { cn } from "@/lib/utils";

/** The filters as the page keeps them in the address, so a link reopens the same figures. */
export interface FilterState {
  from: string;
  to: string;
  team: string;
  agent: string;
  category: string;
  channel: string;
  priority: string;
}

const PRESETS = [7, 30, 90];

/** Date range, quick ranges and the five dimension filters every analytics route takes. */
export function AnalyticsFilters({
  orgSlug,
  value,
  onChange,
  rangeError,
  showAgent = true,
  t,
}: {
  orgSlug: string;
  value: FilterState;
  onChange: (patch: Partial<FilterState>) => void;
  rangeError: string | null;
  /** The agents view lists every agent, so it hides the agent filter. */
  showAgent?: boolean;
  t: Translate;
}) {
  const labels = useTicketLabels();
  const { teamOptions, agentOptions, categoryOptions } = useLookups(orgSlug);

  return (
    <section aria-label={t("analytics.filters")} className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("analytics.quickRange")}>
        {PRESETS.map((d) => {
          const range = lastDays(d);
          const active = value.from === range.from && value.to === range.to;
          return (
            <button
              key={d}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(range)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {t("analytics.lastDays", { n: d })}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <Field label={t("analytics.from")} htmlFor="an-from">
          <Input id="an-from" type="date" value={value.from} max={value.to || undefined} onChange={(e) => onChange({ from: e.target.value })} />
        </Field>
        <Field label={t("analytics.to")} htmlFor="an-to">
          <Input id="an-to" type="date" value={value.to} min={value.from || undefined} onChange={(e) => onChange({ to: e.target.value })} />
        </Field>
        <Field label={t("analytics.group.team")} className="col-span-2 md:col-span-1">
          <SearchableCombobox
            options={teamOptions}
            value={value.team}
            onChange={(v) => onChange({ team: v })}
            placeholder={t("analytics.allTeams")}
            emptyText={t("analytics.noTeams")}
          />
        </Field>
        {showAgent && (
          <Field label={t("analytics.group.agent")} className="col-span-2 md:col-span-1">
            <SearchableCombobox
              options={agentOptions}
              value={value.agent}
              onChange={(v) => onChange({ agent: v })}
              placeholder={t("analytics.allAgents")}
              emptyText={t("analytics.noAgents")}
            />
          </Field>
        )}
        <Field label={t("analytics.group.category")} className="col-span-2 md:col-span-1">
          <SearchableCombobox
            options={categoryOptions}
            value={value.category}
            onChange={(v) => onChange({ category: v })}
            placeholder={t("analytics.allCategories")}
            emptyText={t("analytics.noCategories")}
          />
        </Field>
        <Field label={t("analytics.group.channel")}>
          <SearchableCombobox
            options={labels.channelOptions}
            value={value.channel}
            onChange={(v) => onChange({ channel: v })}
            placeholder={t("analytics.allChannels")}
          />
        </Field>
        <Field label={t("analytics.group.priority")}>
          <SearchableCombobox
            options={labels.priorityOptions}
            value={value.priority}
            onChange={(v) => onChange({ priority: v })}
            placeholder={t("analytics.allPriorities")}
          />
        </Field>
      </div>
      {rangeError && (
        <p className="text-sm text-destructive" role="alert">
          {rangeError}
        </p>
      )}
    </section>
  );
}
