"use client";

import { useEffect, useState } from "react";
import { CirclePause, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/hooks/useT";
import type { Translate } from "@/lib/i18n";

interface SLATimerProps {
  dueAt: string;
  breached: boolean;
  label?: string;
  /** The clock is stopped; the deadline moves by the paused time once it restarts. */
  paused?: boolean;
  /** The policy's pre-breach warning lead. Without it the timer shows no warning colour. */
  warnMinutes?: number;
  className?: string;
}

function formatDuration(ms: number, t: Translate): string {
  if (ms <= 0) return t("time.overdue");
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) return t("time.daysHours", { d: days, h: hours });
  if (hours > 0) return t("time.hoursMinutes", { h: hours, m: minutes });
  return t("time.minutes", { m: minutes });
}

/**
 * Wall-clock time left to a deadline. The deadline already accounts for the policy's business
 * hours, so the countdown is exact while the clock runs. While it is paused the deadline is not
 * final, so the timer says so instead of counting.
 */
export function SLATimer({ dueAt, breached, label, paused, warnMinutes, className }: SLATimerProps) {
  const { t } = useT();
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    const due = new Date(dueAt).getTime();
    const update = () => setRemaining(due - Date.now());
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [dueAt]);

  if (paused && !breached) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <CirclePause className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <div className="leading-tight">
          {label && <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>}
          <span className="text-xs font-semibold text-muted-foreground">{t("sla.paused")}</span>
        </div>
      </div>
    );
  }

  const late = breached || remaining <= 0;
  const warned = !late && !!warnMinutes && remaining <= warnMinutes * 60_000;
  const colour = late
    ? "text-destructive"
    : warned
      ? "text-yellow-600 dark:text-yellow-400"
      : "text-green-600 dark:text-green-400";

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Clock className={cn("h-3.5 w-3.5 shrink-0", colour, late && "animate-pulse")} />
      <div className="leading-tight">
        {label && <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>}
        <span className={cn("text-xs font-semibold tabular-nums", colour)}>
          {breached ? t("sla.breached") : formatDuration(remaining, t)}
        </span>
      </div>
    </div>
  );
}
