"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Clock, HeadphonesIcon, Inbox, ShieldAlert } from "lucide-react";
import { DataTable } from "@bengo-hub/shared-ui-lib/data-table";
import { useTickets } from "@/hooks/useTickets";
import { useLookups } from "@/hooks/useLookups";
import { useServicePermissions } from "@/hooks/useServicePermissions";
import { PageHeader } from "@/components/common/page-header";
import { KpiCard } from "@/components/common/kpi-card";
import { buildTicketColumns } from "@/components/tickets/ticket-columns";
import { cn, orgRoute } from "@/lib/utils";
import { useT } from "@/hooks/useT";
import { useTicketLabels } from "@/lib/ticket-options";
import type { Ticket } from "@/types/tickets";

type Queue = "active" | "pending" | "all";

const ACTIVE = new Set(["new", "open", "in_progress"]);
const PENDING = new Set(["pending_customer", "pending_internal"]);

const QUEUES: { key: Queue; label: string; match: (t: Ticket) => boolean }[] = [
  { key: "active", label: "Active", match: (t) => ACTIVE.has(t.status) },
  { key: "pending", label: "Pending", match: (t) => PENDING.has(t.status) },
  { key: "all", label: "All mine", match: () => true },
];

export default function AgentInboxPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;
  // "My tickets" filters by the agent record, not the SSO user id (tickets store the agent id).
  const { agentId } = useServicePermissions(orgSlug);
  const { agentName, categoryName } = useLookups(orgSlug);
  const { t } = useT();
  const labels = useTicketLabels();
  const [queue, setQueue] = useState<Queue>("active");

  const { data, isLoading, isError, refetch } = useTickets(
    { tenantSlug: orgSlug, agentId: agentId ?? undefined, page: 1, limit: 100 },
    !!agentId,
  );
  const mine = data?.data ?? [];
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

  return (
    <div className="space-y-5">
      <PageHeader icon={HeadphonesIcon} title="My inbox" subtitle="Tickets assigned to you." />

      {!agentId && !isLoading && (
        <p className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          You do not have an agent profile in this workspace yet, so no tickets are assigned to you.
        </p>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={Inbox} label="Active" value={activeCount} loading={isLoading} />
        <KpiCard icon={Clock} label="Pending" value={pendingCount} loading={isLoading} />
        <KpiCard icon={ShieldAlert} label="Past SLA" value={breachedCount} loading={isLoading} tone="destructive" />
        <KpiCard icon={HeadphonesIcon} label="Assigned in total" value={data?.total ?? 0} loading={isLoading} />
      </section>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(t) => t.id}
        loading={isLoading}
        loadingRows={4}
        error={isError}
        onRetry={() => void refetch()}
        emptyText={queue === "active" ? "No active tickets assigned to you." : "Nothing here."}
        onRowClick={(t) => router.push(orgRoute(orgSlug, `/tickets/${t.id}`))}
        maxBodyHeight={false}
        toolbar={
          <div role="tablist" aria-label="Queue" className="inline-flex rounded-lg bg-muted p-1">
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
                {q.label}
              </button>
            ))}
          </div>
        }
      />
      {(data?.total ?? 0) > mine.length && (
        <p className="text-xs text-muted-foreground">
          Showing your {mine.length} most recent tickets of {data?.total}. Use the Tickets page to search the rest.
        </p>
      )}
    </div>
  );
}
