"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  CircleCheck,
  Clock,
  Hourglass,
  Inbox,
  LayoutDashboard,
  PlusCircle,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { useTicketAnalytics, useTicketStats } from "@/hooks/useTickets";
import { useAgents, useTeams } from "@/hooks/useAgents";
import { useServicePermissions } from "@/hooks/useServicePermissions";
import { PERM } from "@/lib/rbac/permissions";
import { PageHeader } from "@/components/common/page-header";
import { KpiCard } from "@/components/common/kpi-card";
import { splitPeriods, statusCounts } from "@/lib/analytics";
import { visibleNav } from "@/lib/nav";
import { useT } from "@/hooks/useT";
import { orgRoute } from "@/lib/utils";

const PERIOD = 7;

export default function AdminDashboardPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const { can } = useServicePermissions(orgSlug);

  const stats = useTicketStats(orgSlug);
  // Twice the period, so the latest week can be compared with the week before it.
  const analytics = useTicketAnalytics(orgSlug, PERIOD * 2);
  const agents = useAgents(orgSlug, { limit: 100 }, can(PERM.agentsView, PERM.agentsManage));
  const teams = useTeams(orgSlug, { limit: 100 }, can(PERM.teamsView, PERM.teamsManage));

  const c = statusCounts(stats.data);
  const { current, previous } = splitPeriods(analytics.data?.trend, PERIOD);
  const agentRows = agents.data?.data ?? [];
  const available = agentRows.filter((a) => a.is_active && a.status === "available").length;
  const activeAgents = agentRows.filter((a) => a.is_active).length;

  const { t } = useT();
  const admin = visibleNav(can).find((s) => s.id === "admin")?.items.filter((i) => i.href !== "/admin") ?? [];

  return (
    <div className="space-y-6">
      <PageHeader icon={LayoutDashboard} title="Admin dashboard" subtitle="An overview of your support operation." />

      <section aria-label="Ticket counts" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard icon={Inbox} label="All tickets" value={c.total} loading={stats.isLoading} />
        <KpiCard icon={Sparkles} label="New" value={c.new} loading={stats.isLoading} />
        <KpiCard icon={Inbox} label="Open" value={c.open} loading={stats.isLoading} />
        <KpiCard icon={Clock} label="In progress" value={c.inProgress} loading={stats.isLoading} tone="warning" />
        <KpiCard icon={Hourglass} label="Pending" value={c.pending} loading={stats.isLoading} />
        <KpiCard icon={CircleCheck} label="Resolved" value={c.resolved} loading={stats.isLoading} tone="success" />
      </section>

      <section aria-label="This week" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={PlusCircle}
          label={`Created, last ${PERIOD} days`}
          value={current.created}
          previous={previous?.created}
          previousLabel={`the ${PERIOD} days before`}
          loading={analytics.isLoading}
        />
        <KpiCard
          icon={CircleCheck}
          label={`Resolved, last ${PERIOD} days`}
          value={current.resolved}
          previous={previous?.resolved}
          previousLabel={`the ${PERIOD} days before`}
          loading={analytics.isLoading}
          tone="success"
        />
        {can(PERM.agentsView, PERM.agentsManage) && (
          <KpiCard
            icon={Shield}
            label="Agents available"
            display={`${available} of ${activeAgents}`}
            loading={agents.isLoading}
            footnote={
              <Link href={orgRoute(orgSlug, "/admin/agents")} className="inline-flex items-center gap-1 text-primary hover:underline">
                Manage agents <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />
        )}
        {can(PERM.teamsView, PERM.teamsManage) && (
          <KpiCard
            icon={Users}
            label="Teams"
            value={teams.data?.total ?? 0}
            loading={teams.isLoading}
            footnote={
              <Link href={orgRoute(orgSlug, "/admin/teams")} className="inline-flex items-center gap-1 text-primary hover:underline">
                Manage teams <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />
        )}
      </section>

      {admin.length > 0 && (
        <section aria-label="Settings" className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">Configure</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {admin.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={orgRoute(orgSlug, item.href)}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1 text-sm font-medium">{t(item.label)}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
