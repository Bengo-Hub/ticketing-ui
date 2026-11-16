"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/hooks/useT";
import type { Translate } from "@/lib/i18n";

interface SLATimerProps {
  dueAt: string;
  breached: boolean;
  label?: string;
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

// The prop carries only the deadline, not when the clock started, so colour bands measure the time
// left against a fixed 4-hour window. It is visual only.
const COLOUR_WINDOW_MS = 4 * 60 * 60 * 1000;

export function SLATimer({ dueAt, breached, label, className }: SLATimerProps) {
  const { t } = useT();
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    const due = new Date(dueAt).getTime();

    const update = () => {
      const now = Date.now();
      setRemaining(due - now);
    };

    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [dueAt]);

  const pct = Math.max(0, remaining / COLOUR_WINDOW_MS);

  const colour =
    breached || remaining <= 0
      ? "text-destructive"
      : pct < 0.1
        ? "text-destructive"
        : pct < 0.5
          ? "text-yellow-600 dark:text-yellow-400"
          : "text-green-600 dark:text-green-400";

  const pulse = breached || remaining <= 0;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Clock className={cn("h-3.5 w-3.5 shrink-0", colour, pulse && "animate-pulse")} />
      <div className="leading-tight">
        {label && <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>}
        <span className={cn("text-xs font-semibold tabular-nums", colour)}>
          {breached ? t("sla.breached") : formatDuration(remaining, t)}
        </span>
      </div>
    </div>
  );
}
