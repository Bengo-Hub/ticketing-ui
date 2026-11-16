"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ClipboardList, PlusCircle } from "lucide-react";
import { DataTable } from "@bengo-hub/shared-ui-lib/data-table";
import { useDebouncedSearch } from "@bengo-hub/shared-ui-lib/search";
import { flattenPages, useTicketList } from "@/hooks/useTickets";
import { useTicketStream } from "@/hooks/useSSE";
import { useLookups } from "@/hooks/useLookups";
import { useServicePermissions } from "@/hooks/useServicePermissions";
import { PERM } from "@/lib/rbac/permissions";
import { PageHeader } from "@/components/common/page-header";
import { LoadMore } from "@/components/common/load-more";
import { Button } from "@/components/ui/base";
import { buildTicketColumns } from "@/components/tickets/ticket-columns";
import { BulkBar } from "@/components/tickets/inbox/BulkBar";
import { InboxToolbar } from "@/components/tickets/inbox/InboxToolbar";
import { ViewsPanel } from "@/components/tickets/inbox/ViewsPanel";
import {
  EMPTY_FILTERS,
  fromView,
  isFiltered,
  toListFilters,
  toViewFilters,
  type InboxFilters,
} from "@/components/tickets/inbox/filters";
import { useTicketLabels } from "@/lib/ticket-options";
import { useT } from "@/hooks/useT";
import { orgRoute } from "@/lib/utils";
import type { TicketView } from "@/types/workspace";

export default function TicketsPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;
  useTicketStream(orgSlug);
  const { can, isStaff, profile } = useServicePermissions(orgSlug);
  const { agentName, categoryName, categoryOptions } = useLookups(orgSlug);
  const { t } = useT();
  const labels = useTicketLabels();

  // Views, tags and bulk changes work on the whole tenant's tickets, so they are for staff.
  const staffView = can(PERM.ticketsView);
  const canBulk = can(PERM.ticketsChange);

  const [filters, setFilters] = useState<InboxFilters>(EMPTY_FILTERS);
  const [viewId, setViewId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // A new search term starts a new list from its first page, so the selection is cleared.
  const search = useDebouncedSearch({ onTermChange: () => setSelected(new Set()) });

  const query = useTicketList({ tenantSlug: orgSlug, ...toListFilters(filters) }, search.term);
  const rows = useMemo(() => flattenPages(query.data), [query.data]);
  const columns = useMemo(
    () => buildTicketColumns({ agentName, categoryName, labels, t }),
    [agentName, categoryName, labels, t],
  );

  // Changing a filter by hand leaves the saved view it came from.
  const change = (next: Partial<InboxFilters>) => {
    setFilters((f) => ({ ...f, ...next }));
    setViewId(null);
    setSelected(new Set());
  };

  const applyView = (view: TicketView | null) => {
    const restored = view ? fromView(view) : { filters: EMPTY_FILTERS, search: "" };
    setFilters(restored.filters);
    search.setValue(restored.search, { immediate: true });
    setViewId(view?.id ?? null);
    setSelected(new Set());
  };

  const filtered = isFiltered(filters, search.term);
  const table = (
    <div className="min-w-0 space-y-3">
      {canBulk && (
        <BulkBar orgSlug={orgSlug} selected={[...selected]} rows={rows} onClear={() => setSelected(new Set())} />
      )}
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        loading={query.isLoading}
        loadingRows={6}
        error={query.isError}
        onRetry={() => void query.refetch()}
        emptyText={filtered ? t("tickets.emptyFiltered") : t("tickets.empty")}
        onRowClick={(r) => router.push(orgRoute(orgSlug, `/tickets/${r.id}`))}
        storageKey="ticketing.inbox.columns"
        maxBodyHeight={false}
        selectable={canBulk}
        selected={selected}
        onSelectedChange={setSelected}
        toolbar={
          <InboxToolbar
            orgSlug={orgSlug}
            search={search}
            busy={query.isFetching && !query.isFetchingNextPage}
            filters={filters}
            onChange={change}
            categoryOptions={categoryOptions}
            showTags={staffView}
          />
        }
      />
      <LoadMore
        shown={rows.length}
        hasMore={!!query.hasNextPage}
        loading={query.isFetchingNextPage}
        onLoadMore={() => void query.fetchNextPage()}
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <PageHeader
        icon={ClipboardList}
        title={t("tickets.title")}
        subtitle={filters.sort === "created_desc" ? t("tickets.newestFirst") : t("tickets.oldestFirst")}
        actions={
          can(PERM.ticketsAdd) ? (
            <Button onClick={() => router.push(orgRoute(orgSlug, "/tickets/new"))}>
              <PlusCircle className="h-4 w-4" />
              {t("tickets.newTicket")}
            </Button>
          ) : undefined
        }
      />

      {staffView && isStaff ? (
        <div className="grid gap-4 lg:grid-cols-[14rem_minmax(0,1fr)]">
          <aside className="min-w-0">
            <ViewsPanel
              orgSlug={orgSlug}
              activeId={viewId}
              current={{ filters: toViewFilters(filters, search.value), sort: filters.sort }}
              selfUserId={profile?.user_id}
              canManage={can(PERM.ticketsManage)}
              onApply={applyView}
            />
          </aside>
          {table}
        </div>
      ) : (
        table
      )}
    </div>
  );
}
