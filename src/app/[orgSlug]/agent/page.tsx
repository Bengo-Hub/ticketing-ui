"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Clock, HeadphonesIcon, Inbox, ShieldAlert } from "lucide-react";
import { DataTable } from "@bengo-hub/shared-ui-lib/data-table";
import { flattenPages, useTicketList } from "@/hooks/useTickets";
import { useTicketStream } from "@/hooks/useSSE";
import { useLookups } from "@/hooks/useLookups";
import { useServicePermissions } from "@/hooks/useServicePermissions";
import { PageHeader } from "@/components/common/page-header";
import { KpiCard } from "@/components/common/kpi-card";
import { LoadMore } from "@/components/common/load-more";
import { buildTicketColumns } from "@/components/tickets/ticket-columns";
import { cn, orgRoute } from "@/lib/utils";
import { useT } from "@/hooks/useT";
import type { MessageKey } from "@/lib/i18n";
import { useTicketLabels } from "@/lib/ticket-options";
import type { Ticket } from "@/types/tickets";

type Queue = "active" | "pending" | "all";

const ACTIVE = new Set(["new", "open", "in_progress"]);
const PENDING = new Set(["pending_customer", "pending_internal"]);

const QUEUES: { key: Queue; label: MessageKey; match: (t: Ticket) => boolean }[] = [
  { key: "active", label: "agentQueue.active", match: (t) => ACTIVE.has(t.status) },
  { key: "pending", label: "agentQueue.pending", match: (t) => PENDING.has(t.status) },
  { key: "all", label: "agentQueue.all", match: () => true },
];

/** The API's largest page: the queue reads a whole page of the agent's tickets at a time. */
const QUEUE_PAGE_SIZE = 100;

export default function AgentInboxPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;
  useTicketStream(orgSlug);
  // "My tickets" filters by the agent record, not the SSO user id (tickets store the agent id).
  const { agentId } = useServicePermissions(orgSlug);
  const { agentName, categoryName } = useLookups(orgSlug);
  const { t } = useT();
  const labels = useTicketLabels();
  const [queue, setQueue] = useState<Queue>("active");

  // The list API filters by one status at a time, so the queue tabs split the loaded tickets here.
  const query = useTicketList(
    { tenantSlug: orgSlug, agentId: agentId ?? undefined, limit: QUEUE_PAGE_SIZE },
    "",
    !!agentId,
  );
  const mine = useMemo(() => flattenPages(query.data), [query.data]);
  const activeCount = mine.filter((t) => ACTIVE.has(t.status)).length;
  const pendingCount = mine.filter((t) => PENDING.has(t.status)).length;
  const breachedCount = mine.filter(
    (t) => (ACTIVE.has(t.status) || PENDING.has(t.status)) && (t.sla_response_breached || t.sla_resolution_breached),
  ).length;

  const match = QUEUES.find((q) => q.key === queue)!.match;
  const rows = mine.filter(match);
  const columns = useMemo(
    () => buildTicketColumns({ agentName, categoryName, labels, t }).filter((c) => c.key !== "assignee"),
    [agentName, categoryName, labels, t],
  );
  const loading = query.isLoading;

  return (
    <div className="space-y-5">
      <PageHeader icon={HeadphonesIcon} title={t("agentQueue.title")} subtitle={t("agentQueue.subtitle")} />

      {!agentId && !loading && (
        <p className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          {t("agentQueue.noProfile")}
        </p>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={Inbox} label={t("agentQueue.active")} value={activeCount} loading={loading} />
        <KpiCard icon={Clock} label={t("agentQueue.pending")} value={pendingCount} loading={loading} />
        <KpiCard icon={ShieldAlert} label={t("agentQueue.pastSla")} value={breachedCount} loading={loading} tone="destructive" />
        <KpiCard icon={HeadphonesIcon} label={t("agentQueue.loaded")} value={mine.length} loading={loading} />
      </section>
      {query.hasNextPage && <p className="text-xs text-muted-foreground">{t("agentQueue.countsLoaded")}</p>}

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        loading={loading}
        loadingRows={4}
        error={query.isError}
        onRetry={() => void query.refetch()}
        emptyText={queue === "active" ? t("agentQueue.emptyActive") : t("agentQueue.empty")}
        onRowClick={(r) => router.push(orgRoute(orgSlug, `/tickets/${r.id}`))}
        maxBodyHeight={false}
        toolbar={
          <div role="tablist" aria-label={t("agentQueue.queue")} className="inline-flex rounded-lg bg-muted p-1">
            {QUEUES.map((q) => (
              <button
                key={q.key}
                type="button"
                role="tab"
                aria-selected={queue === q.key}
                onClick={() => setQueue(q.key)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  queue === q.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t(q.label)}
              </button>
            ))}
          </div>
        }
      />
      <LoadMore
        shown={mine.length}
        hasMore={!!query.hasNextPage}
        loading={query.isFetchingNextPage}
        onLoadMore={() => void query.fetchNextPage()}
      />
    </div>
  );
}
