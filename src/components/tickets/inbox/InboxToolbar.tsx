"use client";

import { useMemo } from "react";
import { MultiSelectCombobox, SearchableCombobox, type ComboboxOption } from "@bengo-hub/shared-ui-lib/combobox";
import { SearchInput } from "@bengo-hub/shared-ui-lib/search";
import type { DebouncedSearch } from "@bengo-hub/shared-ui-lib/search";
import { useTicketTags } from "@/hooks/useTickets";
import { useT } from "@/hooks/useT";
import { useTicketLabels } from "@/lib/ticket-options";
import type { TicketChannel, TicketPriority, TicketSort, TicketStatus } from "@/types/tickets";
import { effectiveSort, type InboxFilters } from "./filters";

/**
 * Search and filters above the inbox. The tag filter (tickets carrying every chosen tag) and the
 * SLA order are for staff, who are the only ones who can list the tenant's tags and work to SLA.
 */
export function InboxToolbar({
  orgSlug,
  search,
  busy,
  filters,
  onChange,
  categoryOptions,
  showTags,
  showSLASort,
}: {
  orgSlug: string;
  search: DebouncedSearch;
  busy: boolean;
  filters: InboxFilters;
  onChange: (next: Partial<InboxFilters>) => void;
  categoryOptions: ComboboxOption[];
  showTags: boolean;
  showSLASort: boolean;
}) {
  const { t } = useT();
  const labels = useTicketLabels();
  const tags = useTicketTags(orgSlug, showTags);
  const tagOptions = useMemo<ComboboxOption[]>(() => {
    const known = (tags.data ?? []).map((tc) => ({ value: tc.tag, label: tc.tag, hint: String(tc.count) }));
    // A tag restored from a saved view may no longer be in use; keep it selectable so it can be removed.
    const missing = filters.tags.filter((tag) => !known.some((o) => o.value === tag)).map((tag) => ({ value: tag, label: tag }));
    return [...known, ...missing];
  }, [tags.data, filters.tags]);

  return (
    <div className="grid w-full grid-cols-2 gap-2 lg:grid-cols-[minmax(14rem,2fr)_repeat(4,minmax(0,1fr))]">
      <SearchInput search={search} busy={busy} placeholder={t("tickets.search")} className="col-span-2 lg:col-span-1" />
      <SearchableCombobox
        options={labels.statusOptions}
        value={filters.status}
        onChange={(v) => onChange({ status: v as TicketStatus | "" })}
        placeholder={t("tickets.allStatuses")}
        searchPlaceholder={t("tickets.status")}
      />
      <SearchableCombobox
        options={labels.priorityOptions}
        value={filters.priority}
        onChange={(v) => onChange({ priority: v as TicketPriority | "" })}
        placeholder={t("tickets.allPriorities")}
        searchPlaceholder={t("tickets.priority")}
      />
      <SearchableCombobox
        options={labels.channelOptions}
        value={filters.channel}
        onChange={(v) => onChange({ channel: v as TicketChannel | "" })}
        placeholder={t("tickets.allChannels")}
        searchPlaceholder={t("tickets.channel")}
      />
      <SearchableCombobox
        options={categoryOptions}
        value={filters.categoryId}
        onChange={(v) => onChange({ categoryId: v })}
        placeholder={t("tickets.allCategories")}
        searchPlaceholder={t("tickets.category")}
        emptyText={t("tickets.noCategories")}
      />
      {showTags && (
        <MultiSelectCombobox
          options={tagOptions}
          values={filters.tags}
          onChange={(values) => onChange({ tags: values })}
          placeholder={t("tags.filter")}
          searchPlaceholder={t("tags.search")}
          emptyText={t("tags.none")}
          className="col-span-2 lg:col-span-4"
        />
      )}
      <TicketSortControl
        value={effectiveSort(filters.sort, showSLASort)}
        onChange={(sort) => onChange({ sort })}
        withSLA={showSLASort}
        className="col-span-2 lg:col-span-1"
      />
    </div>
  );
}

/**
 * The order of a ticket list: SLA due first (staff), newest first or oldest first. Choosing an
 * order starts the list again from its first page, since a cursor belongs to one order.
 */
export function TicketSortControl({
  value,
  onChange,
  withSLA,
  className,
}: {
  value: TicketSort;
  onChange: (sort: TicketSort) => void;
  withSLA: boolean;
  className?: string;
}) {
  const { t } = useT();
  const options = useMemo<ComboboxOption[]>(
    () => [
      ...(withSLA ? [{ value: "sla_due", label: t("tickets.slaDueFirst") }] : []),
      { value: "created_desc", label: t("tickets.newestFirst") },
      { value: "created_asc", label: t("tickets.oldestFirst") },
    ],
    [withSLA, t],
  );
  return (
    <SearchableCombobox
      options={options}
      value={value}
      onChange={(v) => {
        // The order cannot be cleared; an empty choice keeps the current one.
        if (v) onChange(v as TicketSort);
      }}
      placeholder={t("tickets.order")}
      searchPlaceholder={t("tickets.order")}
      clearable={false}
      className={className}
    />
  );
}
