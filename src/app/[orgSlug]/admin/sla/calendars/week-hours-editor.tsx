"use client";

import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/base";
import { useT } from "@/hooks/useT";
import { clockMinutes, WEEKDAYS } from "@/lib/sla";
import { cn } from "@/lib/utils";
import type { Weekday, WeeklyHours, WorkInterval } from "@/types/sla";

/**
 * A time input cannot show 24:00, so a closing time of midnight is entered as 00:00 and stored as
 * the API's "24:00".
 */
const shown = (end: string) => (end === "24:00" ? "00:00" : end);
const stored = (end: string) => (end === "00:00" ? "24:00" : end);

export type WeekProblem = { kind: "empty" } | { kind: "range" | "overlap"; day: Weekday };

/** The first problem the API would refuse the week for (clock.New), or null. */
export function weekProblem(week: WeeklyHours): WeekProblem | null {
  let worked = false;
  for (const day of WEEKDAYS) {
    const spans = (week[day] ?? []).map((iv) => [clockMinutes(iv.start), clockMinutes(iv.end)] as const);
    for (const [s, e] of spans) {
      if (Number.isNaN(s) || Number.isNaN(e) || s >= e) return { kind: "range", day };
    }
    const sorted = [...spans].sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i][0] < sorted[i - 1][1]) return { kind: "overlap", day };
    }
    worked = worked || spans.length > 0;
  }
  return worked ? null : { kind: "empty" };
}

/** Opening and closing times per weekday. A day with no period is closed. */
export function WeekHoursEditor({ week, onChange }: { week: WeeklyHours; onChange: (week: WeeklyHours) => void }) {
  const { t } = useT();
  const setDay = (day: Weekday, intervals: WorkInterval[]) => onChange({ ...week, [day]: intervals });

  return (
    <fieldset className="space-y-2">
      <legend className="mb-1 text-sm font-medium">{t("slaCalendars.weeklyHours")}</legend>
      <p className="text-xs text-muted-foreground">{t("slaCalendars.weeklyHoursHint")}</p>
      <div className="divide-y divide-border rounded-lg border border-border">
        {WEEKDAYS.map((day) => {
          const intervals = week[day] ?? [];
          const open = intervals.length > 0;
          return (
            <div key={day} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start">
              <div className="flex items-center justify-between gap-3 sm:w-40 sm:shrink-0 sm:pt-2">
                <span className="text-sm font-medium">{t(`slaCalendars.day.${day}`)}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={open}
                  aria-label={t("slaCalendars.openOn", { day: t(`slaCalendars.day.${day}`) })}
                  onClick={() => setDay(day, open ? [] : [{ start: "08:00", end: "17:00" }])}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                    open ? "bg-primary" : "bg-input",
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
                      open ? "translate-x-4" : "translate-x-0.5",
                    )}
                  />
                </button>
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                {!open && <p className="text-sm text-muted-foreground sm:pt-2">{t("slaCalendars.closed")}</p>}
                {intervals.map((iv, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={iv.start}
                      onChange={(e) => setDay(day, intervals.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))}
                      aria-label={t("slaCalendars.opensAt")}
                      className="min-w-0 flex-1"
                    />
                    <span className="shrink-0 text-xs text-muted-foreground">{t("slaCalendars.to")}</span>
                    <Input
                      type="time"
                      value={shown(iv.end)}
                      onChange={(e) =>
                        setDay(day, intervals.map((x, j) => (j === i ? { ...x, end: stored(e.target.value) } : x)))
                      }
                      aria-label={t("slaCalendars.closesAt")}
                      className="min-w-0 flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => setDay(day, intervals.filter((_, j) => j !== i))}
                      className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label={t("slaCalendars.removePeriod")}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {open && (
                  <button
                    type="button"
                    onClick={() => {
                      const last = intervals[intervals.length - 1];
                      const start = last && last.end !== "24:00" ? last.end : "13:00";
                      setDay(day, [...intervals, { start, end: "24:00" }]);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" /> {t("slaCalendars.addPeriod")}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
