"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface SLATimerProps {
  dueAt: string;
  breached: boolean;
  label?: string;
  className?: string;
}

function formatDuration(ms: number): string {
  if (ms <= 0) return "Overdue";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function SLATimer({ dueAt, breached, label, className }: SLATimerProps) {
  const [remaining, setRemaining] = useState<number>(0);
  const [totalWindow, setTotalWindow] = useState<number>(1);

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

  // Approximate window as 2× the original deadline offset from a "10 minutes ago" anchor
  // This is visual only; use remaining/totalWindow ratio for colour bands.
  useEffect(() => {
    // We don't know when the ticket was created from this prop alone, so use
    // remaining vs. a reference of 4 hours as the "full" window for colour purposes.
    setTotalWindow(4 * 60 * 60 * 1000);
  }, []);

  const pct = totalWindow > 0 ? Math.max(0, remaining / totalWindow) : 0;

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
          {breached ? "Breached" : formatDuration(remaining)}
        </span>
      </div>
    </div>
  );
}
