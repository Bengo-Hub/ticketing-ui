"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { SearchableCombobox, type ComboboxOption } from "@bengo-hub/shared-ui-lib/combobox";
import { useAvailableAgents } from "@/hooks/useAgents";
import { useBulkUpdate, useTicketTags } from "@/hooks/useTickets";
import { useLookups } from "@/hooks/useLookups";
import { useServicePermissions } from "@/hooks/useServicePermissions";
import { useT } from "@/hooks/useT";
import { PERM } from "@/lib/rbac/permissions";
import { useTicketLabels } from "@/lib/ticket-options";
import type { Ticket, TicketPriority, TicketStatus } from "@/types/tickets";
import type { BulkResult, BulkUpdateData } from "@/types/workspace";

/** The API changes at most this many tickets in one request. */
export const BULK_LIMIT = 100;

/**
 * Bulk changes for the selected tickets: status, priority, assignee, team and tags. Each picker
 * applies at once. The API applies what it can and reports each ticket that could not take the
 * change, and those are listed by number until dismissed.
 */
export function BulkBar({
  orgSlug,
  selected,
  rows,
  onClear,
}: {
  orgSlug: string;
  selected: string[];
  /** Loaded rows, to name failed tickets by number. */
  rows: Ticket[];
  onClear: () => void;
}) {
  const { t } = useT();
  const labels = useTicketLabels();
  const { agentOptions, teamOptions } = useLookups(orgSlug);
  const { can } = useServicePermissions(orgSlug);
  const available = useAvailableAgents(orgSlug, selected.length > 0 && can(PERM.agentsView, PERM.agentsManage));
  const tags = useTicketTags(orgSlug, selected.length > 0);
  const bulk = useBulkUpdate(orgSlug);
  const [failures, setFailures] = useState<BulkResult[]>([]);

  // Available agents first, least loaded first, then everyone else.
  const assignOptions = useMemo<ComboboxOption[]>(() => {
    const free = (available.data ?? []).map((a) => ({
      value: a.id,
      label: a.display_name,
      hint: t("bulk.load", { n: a.current_ticket_count, max: a.max_concurrent_tickets }),
    }));
    const seen = new Set(free.map((o) => o.value));
    return [...free, ...agentOptions.filter((o) => !seen.has(o.value))];
  }, [available.data, agentOptions, t]);
  const tagOptions = useMemo<ComboboxOption[]>(
    () => (tags.data ?? []).map((tc) => ({ value: tc.tag, label: tc.tag, hint: String(tc.count) })),
    [tags.data],
  );

  const tooMany = selected.length > BULK_LIMIT;
  const numberOf = (id: string) => rows.find((r) => r.id === id)?.ticket_number ?? id.slice(0, 8);

  const run = async (change: Omit<BulkUpdateData, "ids">) => {
    if (tooMany || selected.length === 0) return;
    try {
      const res = await bulk.mutateAsync({ ids: selected, ...change });
      setFailures(res.results.filter((r) => !r.ok));
      if (res.failed === 0) {
        toast.success(t("bulk.done", { n: res.updated }));
        onClear();
      } else {
        toast.warning(t("bulk.partial", { ok: res.updated, failed: res.failed }));
      }
    } catch {
      toast.error(t("bulk.failed"));
    }
  };

  if (selected.length === 0 && failures.length === 0) return null;

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <section
          aria-label={t("bulk.title")}
          className="space-y-2 rounded-xl border border-primary/30 bg-primary/5 p-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{t("bulk.selected", { n: selected.length })}</span>
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" /> {t("bulk.clear")}
            </button>
            {bulk.isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label={t("common.loading")} />}
          </div>
          {tooMany ? (
            <p className="text-xs text-destructive">{t("bulk.tooMany", { max: BULK_LIMIT })}</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
              <SearchableCombobox
                options={labels.statusOptions}
                value=""
                onChange={(v) => v && void run({ status: v as TicketStatus })}
                placeholder={t("bulk.setStatus")}
                searchPlaceholder={t("tickets.status")}
                disabled={bulk.isPending}
              />
              <SearchableCombobox
                options={labels.priorityOptions}
                value=""
                onChange={(v) => v && void run({ priority: v as TicketPriority })}
                placeholder={t("bulk.setPriority")}
                searchPlaceholder={t("tickets.priority")}
                disabled={bulk.isPending}
              />
              <SearchableCombobox
                options={assignOptions}
                value=""
                onChange={(v) => v && void run({ agent_id: v })}
                placeholder={t("bulk.assignAgent")}
                searchPlaceholder={t("tickets.agent")}
                emptyText={t("ticket.noAgents")}
                disabled={bulk.isPending}
              />
              <SearchableCombobox
                options={teamOptions}
                value=""
                onChange={(v) => v && void run({ team_id: v })}
                placeholder={t("bulk.assignTeam")}
                searchPlaceholder={t("ticket.team")}
                emptyText={t("ticket.noTeams")}
                disabled={bulk.isPending}
              />
              <SearchableCombobox
                options={tagOptions}
                value=""
                onChange={(v) => v && void run({ add_tags: [v] })}
                onCreate={(text) => void run({ add_tags: [text] })}
                createLabel={t("tags.addNew")}
                placeholder={t("bulk.addTag")}
                searchPlaceholder={t("tags.search")}
                emptyText={t("tags.none")}
                disabled={bulk.isPending}
                className="col-span-2 lg:col-span-1"
              />
            </div>
          )}
        </section>
      )}

      {failures.length > 0 && (
        <section
          role="alert"
          className="rounded-xl border border-warning/40 bg-warning/5 p-3 text-sm"
        >
          <div className="mb-1.5 flex items-start justify-between gap-2">
            <p className="flex items-center gap-2 font-semibold text-warning">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {t("bulk.failuresTitle", { n: failures.length })}
            </p>
            <button
              type="button"
              onClick={() => setFailures([])}
              aria-label={t("common.close")}
              className="rounded-md p-1 text-muted-foreground hover:bg-accent"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <ul className="space-y-1">
            {failures.map((f) => (
              <li key={f.id} className="wrap-break-word text-xs">
                <span className="font-mono font-semibold">#{numberOf(f.id)}</span>{" "}
                <span className="text-muted-foreground">{f.error ?? t("bulk.failed")}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
