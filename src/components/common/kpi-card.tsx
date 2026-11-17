"use client";

import type { ReactNode } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { useT } from "@/hooks/useT";
import { cn } from "@/lib/utils";

/**
 * How the API words a change: `percent` is a relative change (`*_pct`), `points` a difference in
 * percentage points (compliance, satisfied share) and `score` a difference on the 1 to 5 CSAT scale.
 */
export type ChangeKind = "percent" | "points" | "score";

/**
 * A headline figure in the maskani-ui pattern. When `change` is given (the API's comparison with
 * the previous period, null when there is nothing to compare) a line under the figure says it in
 * words with an arrow, never by colour alone. Live counts with no history leave `change` out.
 */
export function KpiCard({
  icon: Icon,
  label,
  value,
  display,
  change,
  changeKind = "percent",
  previousLabel,
  footnote,
  loading,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value?: number;
  display?: ReactNode;
  change?: number | null;
  changeKind?: ChangeKind;
  previousLabel?: string;
  footnote?: ReactNode;
  loading?: boolean;
  tone?: "default" | "success" | "warning" | "destructive";
}) {
  const { t } = useT();
  const period = previousLabel ?? t("kpi.previousPeriod");
  const iconTone = {
    default: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
  }[tone];

  let compare: ReactNode = null;
  if (change !== undefined) {
    if (change === null || Number.isNaN(change)) {
      compare = <span>{t("kpi.noCompare", { period })}</span>;
    } else {
      const size = changeKind === "score" ? Math.round(Math.abs(change) * 100) / 100 : Math.round(Math.abs(change) * 10) / 10;
      const dir = size === 0 ? 0 : change > 0 ? 1 : -1;
      const amount =
        changeKind === "percent" ? `${size}%` : changeKind === "points" ? t("kpi.points", { n: size }) : String(size);
      const DeltaIcon = dir > 0 ? ArrowUpRight : dir < 0 ? ArrowDownRight : ArrowRight;
      const text = dir === 0 ? t("kpi.level") : t(dir > 0 ? "kpi.up" : "kpi.down", { amount });
      compare = (
        <span className="inline-flex items-center gap-1">
          <DeltaIcon className="h-3.5 w-3.5 shrink-0 text-foreground" aria-hidden />
          <span>
            <span className="font-medium text-foreground">{text}</span> {t("kpi.onPeriod", { period })}
          </span>
        </span>
      );
    }
  }

  return (
    <div className="flex h-full min-w-0 flex-col gap-2 rounded-xl border border-border bg-card p-4">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", iconTone)}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <span className="truncate">{label}</span>
      </span>
      {loading ? (
        <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
      ) : (
        <p className="text-2xl font-semibold tabular-nums tracking-tight">{display ?? value ?? "-"}</p>
      )}
      {!loading && compare && <p className="text-xs text-muted-foreground">{compare}</p>}
      {footnote && !loading && <p className="mt-auto text-xs text-muted-foreground">{footnote}</p>}
    </div>
  );
}
