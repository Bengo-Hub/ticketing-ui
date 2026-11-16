"use client";

import { useMemo } from "react";
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react";
import { MultiSelectCombobox, SearchableCombobox, type ComboboxOption } from "@bengo-hub/shared-ui-lib/combobox";
import { SearchInput } from "@bengo-hub/shared-ui-lib/search";
import type { DebouncedSearch } from "@bengo-hub/shared-ui-lib/search";
import { Button } from "@/components/ui/base";
import { useTicketTags } from "@/hooks/useTickets";
import { useT } from "@/hooks/useT";
import { useTicketLabels } from "@/lib/ticket-options";
import type { TicketChannel, TicketPriority, TicketStatus } from "@/types/tickets";
import type { InboxFilters } from "./filters";

/**
 * Search and filters above the inbox. The tag filter (tickets carrying every chosen tag) is for
 * staff, who are the only ones who can list the tenant's tags.
 */
export function InboxToolbar({
  orgSlug,
  search,
  busy,
  filters,
  onChange,
  categoryOptions,
  showTags,
}: {
  orgSlug: string;
  search: DebouncedSearch;
  busy: boolean;
  filters: InboxFilters;
  onChange: (next: Partial<InboxFilters>) => void;
  categoryOptions: ComboboxOption[];
  showTags: boolean;
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
  const newest = filters.sort === "created_desc";

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
      <Button
        variant="outline"
        size="sm"
        className="col-span-2 h-10 justify-start lg:col-span-1"
        onClick={() => onChange({ sort: newest ? "created_asc" : "created_desc" })}
        aria-label={t("tickets.sortToggle", { current: newest ? t("tickets.newestFirst") : t("tickets.oldestFirst") })}
      >
        {newest ? <ArrowDownWideNarrow className="h-4 w-4" /> : <ArrowUpNarrowWide className="h-4 w-4" />}
        {newest ? t("tickets.newestFirst") : t("tickets.oldestFirst")}
      </Button>
    </div>
  );
}
