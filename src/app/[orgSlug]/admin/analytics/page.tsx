"use client";

import { Suspense, useMemo } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { AgentsView } from "@/components/analytics/agents-view";
import { AnalyticsFilters, type FilterState } from "@/components/analytics/analytics-filters";
import { CsatView } from "@/components/analytics/csat-view";
import { ExportButtons } from "@/components/analytics/export-buttons";
import { PeriodNote } from "@/components/analytics/period";
import { SLAView } from "@/components/analytics/sla-view";
import { TicketsView } from "@/components/analytics/tickets-view";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useT } from "@/hooks/useT";
import type { MessageKey } from "@/lib/i18n";
import { browserTimeZone, DEFAULT_ANALYTICS_DAYS, daysInRange, lastDays, MAX_ANALYTICS_DAYS } from "@/lib/analytics";
import { cn, orgRoute } from "@/lib/utils";
import type { AnalyticsParams, AnalyticsView } from "@/types/analytics";
import type { TicketChannel, TicketPriority } from "@/types/tickets";

const VIEWS: { key: AnalyticsView; label: MessageKey }[] = [
  { key: "tickets", label: "analytics.viewTickets" },
  { key: "agents", label: "analytics.viewAgents" },
  { key: "sla", label: "analytics.viewSla" },
  { key: "csat", label: "analytics.viewCsat" },
];

export default function AnalyticsPage() {
  return (
    <Suspense fallback={null}>
      <Analytics />
    </Suspense>
  );
}

/**
 * Tickets, agents, SLA and CSAT analytics from ticketing-api's rollup routes. The view and the
 * filters live in the address, so a link or a reload opens the same figures, and the export buttons
 * send the same query as the screen. Day boundaries follow the browser's time zone.
 */
function Analytics() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const { t } = useT();

  const viewParam = search.get("view");
  const view: AnalyticsView = VIEWS.some((v) => v.key === viewParam) ? (viewParam as AnalyticsView) : "tickets";
  const fallback = lastDays(DEFAULT_ANALYTICS_DAYS);
  const filters: FilterState = {
    from: search.get("from") ?? fallback.from,
    to: search.get("to") ?? fallback.to,
    team: search.get("team") ?? "",
    agent: search.get("agent") ?? "",
    category: search.get("category") ?? "",
    channel: search.get("channel") ?? "",
    priority: search.get("priority") ?? "",
  };

  function navigate(patch: Partial<FilterState> & { view?: AnalyticsView }) {
    const next = new URLSearchParams(search.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const days = daysInRange(filters.from, filters.to);
  const rangeError =
    days < 1 ? t("analytics.rangeInvalid") : days > MAX_ANALYTICS_DAYS ? t("analytics.rangeTooLong", { n: MAX_ANALYTICS_DAYS }) : null;

  // The leaderboard lists every agent, so the agent filter does not apply to it.
  const agentFilter = view === "agents" ? "" : filters.agent;
  const { from, to, team, category, channel, priority } = filters;
  const query = useMemo<AnalyticsParams>(
    () => ({
      from,
      to,
      tz: browserTimeZone(),
      team_id: team || undefined,
      agent_id: agentFilter || undefined,
      category_id: category || undefined,
      channel: (channel || undefined) as TicketChannel | undefined,
      priority: (priority || undefined) as TicketPriority | undefined,
    }),
    [from, to, team, agentFilter, category, channel, priority],
  );

  const enabled = !rangeError;
  const tickets = useAnalytics(orgSlug, "tickets", query, enabled && view === "tickets");
  const agents = useAnalytics(orgSlug, "agents", query, enabled && view === "agents");
  const sla = useAnalytics(orgSlug, "sla", query, enabled && view === "sla");
  const csat = useAnalytics(orgSlug, "csat", query, enabled && view === "csat");
  const active = { tickets, agents, sla, csat }[view];
  const loading = active.isLoading && enabled;

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        back={{ href: orgRoute(orgSlug, "/admin"), label: t("nav.admin") }}
        icon={BarChart3}
        title={t("analytics.title")}
        subtitle={t("analytics.subtitle")}
        actions={<ExportButtons orgSlug={orgSlug} view={view} params={query} disabled={!!rangeError} t={t} />}
      />

      <div className="-mx-1 overflow-x-auto px-1">
        <div role="tablist" aria-label={t("analytics.views")} className="inline-flex min-w-max rounded-lg bg-muted p-1">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              role="tab"
              aria-selected={view === v.key}
              onClick={() => navigate({ view: v.key === "tickets" ? undefined : v.key })}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                view === v.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(v.label)}
            </button>
          ))}
        </div>
      </div>

      <AnalyticsFilters
        orgSlug={orgSlug}
        value={filters}
        onChange={(patch) => navigate(patch)}
        rangeError={rangeError}
        showAgent={view !== "agents"}
        t={t}
      />

      {!rangeError && <PeriodNote period={active.data?.period} t={t} />}

      {active.isError && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" aria-hidden />
          <p className="flex-1 text-sm font-medium">{t("analytics.loadFailed")}</p>
          <button type="button" onClick={() => void active.refetch()} className="text-sm font-medium underline">
            {t("common.retry")}
          </button>
        </div>
      )}

      <div role="tabpanel" aria-label={t(VIEWS.find((v) => v.key === view)!.label)}>
        {view === "tickets" && <TicketsView data={tickets.data} loading={loading} t={t} />}
        {view === "agents" && <AgentsView data={agents.data} loading={loading} t={t} />}
        {view === "sla" && <SLAView data={sla.data} loading={loading} t={t} />}
        {view === "csat" && <CsatView orgSlug={orgSlug} data={csat.data} loading={loading} t={t} />}
      </div>
    </div>
  );
}
