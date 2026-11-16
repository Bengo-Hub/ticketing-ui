"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Activity, AlertCircle, BarChart3, CircleCheck, Flame, Inbox, PlusCircle } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTicketAnalytics } from "@/hooks/useTickets";
import { PageHeader } from "@/components/common/page-header";
import { KpiCard } from "@/components/common/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/base";
import { splitPeriods, sumTrend } from "@/lib/analytics";
import { PRIORITY_LABEL, STATUS_LABEL } from "@/lib/ticket-options";
import { cn } from "@/lib/utils";
import type { TicketPriority, TicketStatus } from "@/types/tickets";

const PERIOD_OPTIONS = [7, 30, 90];

const STATUS_COLORS: Record<string, string> = {
  new: "#6366f1",
  open: "#3b82f6",
  in_progress: "#f59e0b",
  pending_customer: "#8b5cf6",
  pending_internal: "#a78bfa",
  resolved: "#10b981",
  closed: "#6b7280",
  cancelled: "#ef4444",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "#10b981",
  normal: "#3b82f6",
  high: "#f59e0b",
  urgent: "#f97316",
  critical: "#ef4444",
};

// Chart chrome reads the theme tokens so it follows light and dark mode.
const AXIS_TICK = { fontSize: 11, fill: "var(--muted-foreground)" };
const TOOLTIP_STYLE = {
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  fontSize: 12,
};

function Legendary({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </span>
      <span className="text-sm font-bold tabular-nums">{value}</span>
    </div>
  );
}

export default function AnalyticsDashboardPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const [days, setDays] = useState(30);

  const { data, isLoading, isError } = useTicketAnalytics(orgSlug, days);
  // The trend for twice the period gives the previous period to compare against. The API buckets
  // by week beyond 90 days, so the 90-day view has no comparison and skips this request.
  const doubled = useTicketAnalytics(orgSlug, days * 2, days * 2 <= 90);
  const { previous } = splitPeriods(doubled.data?.trend, days);

  const period = sumTrend(data?.trend);
  const statusData = data
    ? Object.entries(data.by_status).map(([k, v]) => ({
        key: k,
        name: STATUS_LABEL[k as TicketStatus] ?? k,
        value: v,
        fill: STATUS_COLORS[k] ?? "#6b7280",
      }))
    : [];
  const priorityData = data
    ? Object.entries(data.by_priority).map(([k, v]) => ({
        key: k,
        name: PRIORITY_LABEL[k as TicketPriority] ?? k,
        value: v,
        fill: PRIORITY_COLORS[k] ?? "#6b7280",
      }))
    : [];
  const s = (k: string) => data?.by_status[k] ?? 0;
  const active = s("new") + s("open") + s("in_progress") + s("pending_customer") + s("pending_internal");
  const hot = (data?.by_priority.urgent ?? 0) + (data?.by_priority.critical ?? 0);
  const previousLabel = `the ${days} days before`;

  return (
    <div className="space-y-5">
      <PageHeader
        icon={BarChart3}
        title="Analytics"
        subtitle="Ticket volume and trend."
        actions={
          <div role="tablist" aria-label="Period" className="inline-flex rounded-lg bg-muted p-1">
            {PERIOD_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                role="tab"
                aria-selected={days === d}
                onClick={() => setDays(d)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  days === d ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {d} days
              </button>
            ))}
          </div>
        }
      />

      {isError && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">The analytics could not be loaded.</p>
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard
          icon={PlusCircle}
          label={`Created, ${days} days`}
          value={period.created}
          previous={previous?.created}
          previousLabel={previousLabel}
          loading={isLoading || doubled.isLoading}
        />
        <KpiCard
          icon={CircleCheck}
          label={`Resolved, ${days} days`}
          value={period.resolved}
          previous={previous?.resolved}
          previousLabel={previousLabel}
          loading={isLoading || doubled.isLoading}
          tone="success"
        />
        <KpiCard icon={Inbox} label="All tickets" value={statusData.reduce((t, d) => t + d.value, 0)} loading={isLoading} footnote="All time" />
        <KpiCard icon={Activity} label="Active now" value={active} loading={isLoading} tone="warning" footnote="New, open, in progress or pending" />
        <KpiCard icon={Flame} label="Urgent or critical" value={hot} loading={isLoading} tone="destructive" footnote="All time" />
      </section>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : data ? (
        <>
          <Card>
            <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
              <CardTitle className="text-base font-semibold">Created and resolved, last {days} days</CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0 sm:p-6 sm:pt-0">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={data.trend} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={AXIS_TICK} tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis tick={AXIS_TICK} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="created" name="Created" stroke="#3b82f6" fill="url(#colorCreated)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" fill="url(#colorResolved)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
                <CardTitle className="text-base font-semibold">By status (all time)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-4 pt-0 sm:p-6 sm:pt-0">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                      {statusData.map((d) => (
                        <Cell key={d.key} fill={d.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1">
                  {statusData.map((d) => (
                    <Legendary key={d.key} label={d.name} value={d.value} color={d.fill} />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
                <CardTitle className="text-base font-semibold">By priority (all time)</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={priorityData} layout="vertical" margin={{ left: 0, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tick={AXIS_TICK} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={AXIS_TICK} width={64} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--muted)" }} />
                    <Bar dataKey="value" name="Tickets" radius={[0, 4, 4, 0]}>
                      {priorityData.map((d) => (
                        <Cell key={d.key} fill={d.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1">
                  {priorityData.map((d) => (
                    <Legendary key={d.key} label={d.name} value={d.value} color={d.fill} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
