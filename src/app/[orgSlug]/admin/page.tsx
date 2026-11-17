"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlarmClock,
  ArrowRight,
  CircleCheck,
  Clock,
  Hourglass,
  Inbox,
  LayoutDashboard,
  PlusCircle,
  Shield,
  Sparkles,
  Star,
  UserX,
  Users,
} from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useAgents, useTeams } from "@/hooks/useAgents";
import { useServicePermissions } from "@/hooks/useServicePermissions";
import { PERM } from "@/lib/rbac/permissions";
import { PageHeader } from "@/components/common/page-header";
import { KpiCard } from "@/components/common/kpi-card";
import { previousLabel } from "@/components/analytics/period";
import { browserTimeZone, formatCount, formatScore, lastDays } from "@/lib/analytics";
import { visibleNav } from "@/lib/nav";
import { useT } from "@/hooks/useT";
import { orgRoute } from "@/lib/utils";

/** The dashboard compares the last seven days with the seven before them. */
const PERIOD = 7;

export default function AdminDashboardPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const { can } = useServicePermissions(orgSlug);
  const { t } = useT();

  const { from, to } = lastDays(PERIOD);
  const query = useMemo(() => ({ from, to, tz: browserTimeZone() }), [from, to]);
  const analytics = useAnalytics(orgSlug, "tickets", query);
  const agents = useAgents(orgSlug, { limit: 100 }, can(PERM.agentsView, PERM.agentsManage));
  const teams = useTeams(orgSlug, { limit: 100 }, can(PERM.teamsView, PERM.teamsManage));

  const data = analytics.data;
  const stats = data?.stats;
  const byStatus = stats?.by_status ?? {};
  const pending = (byStatus.pending_customer ?? 0) + (byStatus.pending_internal ?? 0);
  const loading = analytics.isLoading;
  const prev = previousLabel(data?.period, t);

  const agentRows = agents.data?.data ?? [];
  const available = agentRows.filter((a) => a.is_active && a.status === "available").length;
  const activeAgents = agentRows.filter((a) => a.is_active).length;

  const admin = visibleNav(can).find((s) => s.id === "admin")?.items.filter((i) => i.href !== "/admin") ?? [];

  return (
    <div className="space-y-6">
      <PageHeader icon={LayoutDashboard} title={t("dashboard.title")} subtitle={t("dashboard.subtitle")} />

      {analytics.isError && (
        <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {t("analytics.loadFailed")}
        </p>
      )}

      <section aria-label={t("analytics.liveHeading")} className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">{t("analytics.liveHeading")}</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard icon={Inbox} label={t("analytics.open")} value={stats?.open} loading={loading} footnote={t("analytics.openHint")} />
          <KpiCard icon={Sparkles} label={t("ticketStatus.new")} value={byStatus.new ?? 0} loading={loading} />
          <KpiCard icon={Clock} label={t("ticketStatus.in_progress")} value={byStatus.in_progress ?? 0} loading={loading} tone="warning" />
          <KpiCard icon={Hourglass} label={t("dashboard.pending")} value={pending} loading={loading} />
          <KpiCard icon={AlarmClock} label={t("analytics.overdue")} value={stats?.overdue} loading={loading} tone="destructive" />
          <KpiCard icon={UserX} label={t("analytics.unassignedNow")} value={stats?.unassigned} loading={loading} tone="warning" />
          <KpiCard icon={PlusCircle} label={t("analytics.createdToday")} value={stats?.created_today} loading={loading} />
          <KpiCard icon={CircleCheck} label={t("analytics.resolvedToday")} value={stats?.resolved_today} loading={loading} tone="success" />
        </div>
      </section>

      <section aria-label={t("dashboard.lastDays", { n: PERIOD })} className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">{t("dashboard.lastDays", { n: PERIOD })}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <KpiCard
            icon={PlusCircle}
            label={t("analytics.created")}
            display={formatCount(data?.current.created)}
            change={data?.change.created_pct ?? null}
            previousLabel={prev}
            loading={loading}
          />
          <KpiCard
            icon={CircleCheck}
            label={t("analytics.resolved")}
            display={formatCount(data?.current.resolved)}
            change={data?.change.resolved_pct ?? null}
            previousLabel={prev}
            loading={loading}
            tone="success"
          />
          <KpiCard
            icon={Star}
            label={t("analytics.csatAverage")}
            display={data ? t("analytics.outOfFive", { n: formatScore(data.current.csat.average) }) : undefined}
            change={data?.change.csat_average_delta ?? null}
            changeKind="score"
            previousLabel={prev}
            loading={loading}
          />
          {can(PERM.agentsView, PERM.agentsManage) && (
            <KpiCard
              icon={Shield}
              label={t("dashboard.agentsAvailable")}
              display={t("dashboard.availableOf", { available, total: activeAgents })}
              loading={agents.isLoading}
              footnote={
                <Link href={orgRoute(orgSlug, "/admin/agents")} className="inline-flex items-center gap-1 text-primary hover:underline">
                  {t("dashboard.manageAgents")} <ArrowRight className="h-3 w-3" />
                </Link>
              }
            />
          )}
          {can(PERM.teamsView, PERM.teamsManage) && (
            <KpiCard
              icon={Users}
              label={t("dashboard.teams")}
              display={teams.data ? `${teams.data.data.length}${teams.data.has_more ? "+" : ""}` : undefined}
              loading={teams.isLoading}
              footnote={
                <Link href={orgRoute(orgSlug, "/admin/teams")} className="inline-flex items-center gap-1 text-primary hover:underline">
                  {t("dashboard.manageTeams")} <ArrowRight className="h-3 w-3" />
                </Link>
              }
            />
          )}
        </div>
        <Link href={orgRoute(orgSlug, "/admin/analytics")} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          {t("dashboard.openAnalytics")} <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {admin.length > 0 && (
        <section aria-label={t("dashboard.configure")} className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">{t("dashboard.configure")}</h2>
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
