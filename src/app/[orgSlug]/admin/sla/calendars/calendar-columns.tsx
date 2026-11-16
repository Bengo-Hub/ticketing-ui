"use client";

// DataTable column definitions for the business calendars list.

import { Pencil, Trash2 } from "lucide-react";
import type { DataTableColumn } from "@bengo-hub/shared-ui-lib/data-table";
import { Badge } from "@/components/ui/base";
import type { Translate } from "@/lib/i18n";
import { todayISO, WEEKDAYS, weeklyMinutes } from "@/lib/sla";
import type { BusinessCalendar } from "@/types/sla";

function openDays(c: BusinessCalendar, t: Translate): string {
  return WEEKDAYS.filter((d) => (c.weekly_hours[d] ?? []).length > 0)
    .map((d) => t(`slaCalendars.dayShort.${d}`))
    .join(", ");
}

export function buildCalendarColumns({
  t,
  canChange,
  canDelete,
  onEdit,
  onDelete,
}: {
  t: Translate;
  canChange: boolean;
  canDelete: boolean;
  onEdit: (c: BusinessCalendar) => void;
  onDelete: (c: BusinessCalendar) => void;
}): DataTableColumn<BusinessCalendar>[] {
  const today = todayISO();
  const cols: DataTableColumn<BusinessCalendar>[] = [
    {
      key: "name",
      header: t("slaCalendars.colName"),
      primary: true,
      sortable: true,
      accessor: (c) => c.name,
      render: (c) => (
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="truncate font-medium">{c.name}</span>
          {c.is_default && <Badge variant="secondary">{t("slaCalendars.default")}</Badge>}
        </div>
      ),
    },
    {
      key: "timezone",
      header: t("slaCalendars.colTimezone"),
      hideBelow: "md",
      accessor: (c) => c.timezone,
    },
    {
      key: "days",
      header: t("slaCalendars.colDays"),
      accessor: (c) => openDays(c, t),
    },
    {
      key: "hours",
      header: t("slaCalendars.colHours"),
      sortable: true,
      accessor: (c) => weeklyMinutes(c.weekly_hours),
      render: (c) => (
        <span className="tabular-nums">
          {t("slaCalendars.hoursPerWeek", { n: Math.round((weeklyMinutes(c.weekly_hours) / 60) * 10) / 10 })}
        </span>
      ),
    },
    {
      key: "holidays",
      header: t("slaCalendars.colHolidays"),
      hideBelow: "lg",
      accessor: (c) => c.holidays.filter((h) => h.date >= today).length,
      render: (c) => {
        const coming = c.holidays.filter((h) => h.date >= today);
        const toConfirm = coming.filter((h) => h.moon_dependent).length;
        return (
          <div className="flex flex-wrap items-center gap-2">
            <span className="tabular-nums">{t("slaCalendars.comingCount", { n: coming.length })}</span>
            {toConfirm > 0 && <Badge variant="outline">{t("slaCalendars.toConfirm", { n: toConfirm })}</Badge>}
          </div>
        );
      },
    },
  ];
  if (canChange || canDelete) {
    cols.push({
      key: "actions",
      header: "",
      align: "right",
      exportable: false,
      mobileAction: true,
      render: (c) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {canChange && (
            <button
              type="button"
              onClick={() => onEdit(c)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label={t("slaCalendars.editNamed", { name: c.name })}
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(c)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label={t("slaCalendars.deleteNamed", { name: c.name })}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    });
  }
  return cols;
}
