import type { ReactNode } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function delta(value: number, before: number | undefined): { text: string; dir: -1 | 0 | 1 } | null {
  if (before == null || Number.isNaN(before)) return null;
  if (before === 0) return value === 0 ? { text: "level", dir: 0 } : null;
  const pct = Math.round(((value - before) / Math.abs(before)) * 100);
  if (pct === 0) return { text: "level", dir: 0 };
  return { text: `${pct > 0 ? "up" : "down"} ${Math.abs(pct)}%`, dir: pct > 0 ? 1 : -1 };
}

/**
 * A headline figure with, when the API supplies one, its change against the previous period.
 * Direction is said in words with an arrow, never by colour alone. Cards whose figure has no
 * history (a live count) leave `previous` out and show no comparison line.
 */
export function KpiCard({
  icon: Icon,
  label,
  value,
  display,
  previous,
  previousLabel = "previous period",
  footnote,
  loading,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value?: number;
  display?: ReactNode;
  previous?: number;
  previousLabel?: string;
  footnote?: ReactNode;
  loading?: boolean;
  tone?: "default" | "success" | "warning" | "destructive";
}) {
  const d = value != null && previous != null ? delta(value, previous) : null;
  const DeltaIcon = d ? (d.dir > 0 ? ArrowUpRight : d.dir < 0 ? ArrowDownRight : ArrowRight) : null;
  const iconTone = {
    default: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
  }[tone];

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
      {!loading && previous != null && (
        <p className="text-xs text-muted-foreground">
          {d && DeltaIcon ? (
            <span className="inline-flex items-center gap-1">
              <DeltaIcon className="h-3.5 w-3.5 text-foreground" aria-hidden />
              <span>
                <span className="font-medium text-foreground">{d.text}</span> on {previousLabel}
              </span>
            </span>
          ) : (
            <span>{previousLabel}: no comparable figure</span>
          )}
        </p>
      )}
      {footnote && !loading && <p className="mt-auto text-xs text-muted-foreground">{footnote}</p>}
    </div>
  );
}
