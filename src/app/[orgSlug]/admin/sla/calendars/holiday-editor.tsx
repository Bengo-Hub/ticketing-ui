"use client";

import { useState } from "react";
import { Moon, Plus, X } from "lucide-react";
import { Button, Input } from "@/components/ui/base";
import { useT } from "@/hooks/useT";
import { todayISO } from "@/lib/sla";
import { cn } from "@/lib/utils";
import type { Holiday } from "@/types/sla";

/** The index of the first holiday the API would refuse (a bad date or no name), or -1. */
export function holidayProblem(holidays: Holiday[]): number {
  return holidays.findIndex((h) => !/^\d{4}-\d{2}-\d{2}$/.test(h.date) || !h.name.trim());
}

/**
 * The calendar's holidays, coming ones first. Moon-dependent holidays (Idd ul-Fitr) are marked so
 * the date can be confirmed once it is announced; every row stays editable.
 */
export function HolidayEditor({ holidays, onChange }: { holidays: Holiday[]; onChange: (h: Holiday[]) => void }) {
  const { t } = useT();
  const [showPast, setShowPast] = useState(false);
  const today = todayISO();
  const patch = (i: number, next: Partial<Holiday>) => onChange(holidays.map((h, j) => (j === i ? { ...h, ...next } : h)));

  // Rows keep their index in the stored list so edits land on the right holiday.
  const rows = holidays
    .map((h, index) => ({ h, index }))
    .filter(({ h }) => showPast || !h.date || h.date >= today)
    .sort((a, b) => (a.h.date || "9999").localeCompare(b.h.date || "9999"));
  const past = holidays.filter((h) => h.date && h.date < today).length;

  return (
    <fieldset className="space-y-2">
      <legend className="mb-1 text-sm font-medium">{t("slaCalendars.holidays")}</legend>
      <p className="text-xs text-muted-foreground">{t("slaCalendars.holidaysHint")}</p>
      {rows.length === 0 && <p className="text-sm text-muted-foreground">{t("slaCalendars.noHolidays")}</p>}
      <ul className="space-y-2">
        {rows.map(({ h, index }) => (
          <li
            key={index}
            className={cn(
              "space-y-2 rounded-lg border p-3",
              h.moon_dependent ? "border-warning/50 bg-warning/5" : "border-border",
            )}
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                type="date"
                value={h.date}
                onChange={(e) => patch(index, { date: e.target.value })}
                aria-label={t("slaCalendars.holidayDate")}
                className="min-w-0 sm:w-44 sm:shrink-0"
              />
              <Input
                value={h.name}
                onChange={(e) => patch(index, { name: e.target.value })}
                placeholder={t("slaCalendars.holidayName")}
                aria-label={t("slaCalendars.holidayName")}
                className="min-w-0 flex-1"
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <label className="flex min-w-0 cursor-pointer items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0 accent-primary"
                  checked={!!h.moon_dependent}
                  onChange={(e) => patch(index, { moon_dependent: e.target.checked || undefined })}
                />
                <Moon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0">
                  {h.moon_dependent ? t("slaCalendars.moonToConfirm") : t("slaCalendars.moonDependent")}
                </span>
              </label>
              <button
                type="button"
                onClick={() => onChange(holidays.filter((_, j) => j !== index))}
                className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label={t("slaCalendars.removeHoliday", { name: h.name || h.date })}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...holidays, { date: "", name: "" }])}>
          <Plus className="h-4 w-4" /> {t("slaCalendars.addHoliday")}
        </Button>
        {past > 0 && (
          <button type="button" onClick={() => setShowPast((v) => !v)} className="text-xs font-medium text-primary hover:underline">
            {showPast ? t("slaCalendars.hidePast") : t("slaCalendars.showPast", { n: past })}
          </button>
        )}
      </div>
    </fieldset>
  );
}
