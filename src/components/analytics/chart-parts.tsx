"use client";

import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/base";

// Chart chrome reads the theme tokens so it follows light and dark mode.
export const AXIS_TICK = { fontSize: 11, fill: "var(--muted-foreground)" };
export const TOOLTIP_STYLE = {
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  fontSize: 12,
};
export const LEGEND_STYLE = { fontSize: 12 };

/** Series colours, one per meaning, used the same way on every view. */
export const SERIES = {
  created: "#3b82f6",
  resolved: "#10b981",
  firstResponse: "#8b5cf6",
  resolution: "#f59e0b",
  csat: "#ec4899",
  responses: "#94a3b8",
} as const;

export const STATUS_COLORS: Record<string, string> = {
  new: "#6366f1",
  open: "#3b82f6",
  in_progress: "#f59e0b",
  pending_customer: "#8b5cf6",
  pending_internal: "#a78bfa",
};

/** 1 (worst) to 5 (best). */
export const SCORE_COLORS = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#10b981"];

/** A titled card around a chart or a breakdown. */
export function ChartCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent className="p-2 pt-0 sm:p-6 sm:pt-0">{children}</CardContent>
    </Card>
  );
}

/** The placeholder a chart shows while its first load runs. */
export function ChartSkeleton({ height = 260 }: { height?: number }) {
  return <div className="animate-pulse rounded-lg bg-muted" style={{ height }} />;
}

/** One coloured legend row with its value, for short lists beside a chart. */
export function LegendRow({ label, value, color }: { label: string; value: ReactNode; color: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2">
      <span className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
        <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
        <span className="truncate">{label}</span>
      </span>
      <span className="text-sm font-bold tabular-nums">{value}</span>
    </div>
  );
}
