"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTicketAnalytics } from "@/hooks/useTickets";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/base";
import { AlertCircle, BarChart3 } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const PERIOD_OPTIONS = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

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

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm text-muted-foreground capitalize">{label.replace(/_/g, " ")}</span>
      </div>
      <span className="text-sm font-bold tabular-nums">{value}</span>
    </div>
  );
}

export default function AnalyticsDashboardPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const [days, setDays] = useState(30);

  const { data, isLoading, isError } = useTicketAnalytics(orgSlug, days);

  const statusChartData = data
    ? Object.entries(data.by_status).map(([k, v]) => ({ name: k.replace(/_/g, " "), value: v, fill: STATUS_COLORS[k] ?? "#6b7280" }))
    : [];

  const priorityChartData = data
    ? Object.entries(data.by_priority).map(([k, v]) => ({ name: k, value: v, fill: PRIORITY_COLORS[k] ?? "#6b7280" }))
    : [];

  const totalTickets = statusChartData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Ticket volume and trend overview</p>
        </div>
        <div className="flex gap-1">
          {PERIOD_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={days === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => setDays(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {isError && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">Failed to load analytics data.</p>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* Summary row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-black text-foreground">{totalTickets}</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wider">Total tickets</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-black text-green-600">{data.by_status["resolved"] ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wider">Resolved</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-black text-amber-500">{(data.by_status["open"] ?? 0) + (data.by_status["in_progress"] ?? 0)}</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wider">Active</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-black text-red-500">{(data.by_priority["urgent"] ?? 0) + (data.by_priority["critical"] ?? 0)}</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wider">Urgent / Critical</p>
              </CardContent>
            </Card>
          </div>

          {/* Trend chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Ticket trend — last {days} days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={data.trend} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v: string) => v.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="created" name="Created" stroke="#3b82f6" fill="url(#colorCreated)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" fill="url(#colorResolved)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status + Priority side-by-side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* By status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">By Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={statusChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                      {statusChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1">
                  {statusChartData.map((d) => (
                    <StatCard key={d.name} label={d.name} value={d.value} color={d.fill} />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* By priority */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">By Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={priorityChartData} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={60} />
                    <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                    <Bar dataKey="value" name="Tickets" radius={[0, 4, 4, 0]}>
                      {priorityChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="space-y-1 mt-2">
                  {priorityChartData.map((d) => (
                    <StatCard key={d.name} label={d.name} value={d.value} color={d.fill} />
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
