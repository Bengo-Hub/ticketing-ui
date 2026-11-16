"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ClipboardList, PlusCircle } from "lucide-react";
import { DataTable } from "@bengo-hub/shared-ui-lib/data-table";
import { SearchableCombobox } from "@bengo-hub/shared-ui-lib/combobox";
import { SearchInput, useDebouncedSearch } from "@bengo-hub/shared-ui-lib/search";
import { useTicketSearch } from "@/hooks/useTickets";
import { useTicketStream } from "@/hooks/useSSE";
import { useLookups } from "@/hooks/useLookups";
import { useServicePermissions } from "@/hooks/useServicePermissions";
import { PERM } from "@/lib/rbac/permissions";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/base";
import { buildTicketColumns } from "@/components/tickets/ticket-columns";
import { useTicketLabels } from "@/lib/ticket-options";
import { useT } from "@/hooks/useT";
import { orgRoute } from "@/lib/utils";
import type { TicketChannel, TicketPriority, TicketStatus } from "@/types/tickets";

const PAGE_SIZES = [10, 25, 50, 100];

export default function TicketsPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;
  useTicketStream(orgSlug);
  const { can } = useServicePermissions(orgSlug);
  const { agentName, categoryName, categoryOptions } = useLookups(orgSlug);
  const { t } = useT();
  const labels = useTicketLabels();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [status, setStatus] = useState<TicketStatus | "">("");
  const [priority, setPriority] = useState<TicketPriority | "">("");
  const [channel, setChannel] = useState<TicketChannel | "">("");
  const [categoryId, setCategoryId] = useState("");
  const search = useDebouncedSearch({ onTermChange: () => setPage(1) });

  const query = useTicketSearch(
    {
      tenantSlug: orgSlug,
      page,
      limit,
      status: status || undefined,
      priority: priority || undefined,
      channel: channel || undefined,
      categoryId: categoryId || undefined,
    },
    search.term,
  );

  const rows = query.data?.data ?? [];
  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const columns = useMemo(
    () => buildTicketColumns({ agentName, categoryName, labels, t }),
    [agentName, categoryName, labels, t],
  );

  // Every filter change starts again from the first page.
  const filter = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        icon={ClipboardList}
        title={t("tickets.title")}
        subtitle={total > 0 ? t("tickets.subtitleCount", { n: total }) : t("tickets.newestFirst")}
        actions={
          can(PERM.ticketsAdd) ? (
            <Button onClick={() => router.push(orgRoute(orgSlug, "/tickets/new"))}>
              <PlusCircle className="h-4 w-4" />
              {t("tickets.newTicket")}
            </Button>
          ) : undefined
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(t) => t.id}
        loading={query.isLoading}
        loadingRows={6}
        error={query.isError}
        onRetry={() => void query.refetch()}
        emptyText={search.term || status || priority || channel || categoryId ? t("tickets.emptyFiltered") : t("tickets.empty")}
        onRowClick={(t) => router.push(orgRoute(orgSlug, `/tickets/${t.id}`))}
        storageKey="ticketing.inbox.columns"
        maxBodyHeight={false}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        total={total}
        pageSize={limit}
        pageSizeOptions={PAGE_SIZES}
        onPageSizeChange={filter(setLimit)}
        toolbar={
          <div className="grid w-full grid-cols-2 gap-2 lg:grid-cols-[minmax(14rem,2fr)_repeat(4,minmax(0,1fr))]">
            <SearchInput
              search={search}
              busy={query.isFetching}
              placeholder={t("tickets.search")}
              className="col-span-2 lg:col-span-1"
            />
            <SearchableCombobox
              options={labels.statusOptions}
              value={status}
              onChange={(v) => filter(setStatus)(v as TicketStatus | "")}
              placeholder={t("tickets.allStatuses")}
              searchPlaceholder={t("tickets.status")}
            />
            <SearchableCombobox
              options={labels.priorityOptions}
              value={priority}
              onChange={(v) => filter(setPriority)(v as TicketPriority | "")}
              placeholder={t("tickets.allPriorities")}
              searchPlaceholder={t("tickets.priority")}
            />
            <SearchableCombobox
              options={labels.channelOptions}
              value={channel}
              onChange={(v) => filter(setChannel)(v as TicketChannel | "")}
              placeholder={t("tickets.allChannels")}
              searchPlaceholder={t("tickets.channel")}
            />
            <SearchableCombobox
              options={categoryOptions}
              value={categoryId}
              onChange={filter(setCategoryId)}
              placeholder={t("tickets.allCategories")}
              searchPlaceholder={t("tickets.category")}
              emptyText={t("tickets.noCategories")}
            />
          </div>
        }
      />
    </div>
  );
}
