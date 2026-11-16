"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SearchableCombobox, type ComboboxOption } from "@bengo-hub/shared-ui-lib/combobox";
import { FormSheet } from "@/components/common/form-sheet";
import { Field, SwitchField } from "@/components/common/field";
import { Button, Input } from "@/components/ui/base";
import { useSaveCalendar } from "@/hooks/useSLA";
import { useT } from "@/hooks/useT";
import { DEFAULT_TIMEZONE, defaultWeek, timezoneList, WEEKDAYS, zoneOffset } from "@/lib/sla";
import type { BusinessCalendar, Holiday, Weekday, WeeklyHours, WorkInterval } from "@/types/sla";
import { HolidayEditor, holidayProblem } from "./holiday-editor";
import { WeekHoursEditor, weekProblem } from "./week-hours-editor";

/** Creates or edits a business calendar: its timezone, weekly hours and holidays. */
export function CalendarSheet({
  orgSlug,
  calendar,
  isFirst,
  open,
  onOpenChange,
}: {
  orgSlug: string;
  calendar: BusinessCalendar | null;
  /** The tenant has no calendar yet, so the API seeds the Kenyan public holidays. */
  isFirst: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useT();
  const save = useSaveCalendar(orgSlug);
  const [name, setName] = useState(calendar?.name ?? "");
  const [timezone, setTimezone] = useState(calendar?.timezone ?? DEFAULT_TIMEZONE);
  const [week, setWeek] = useState<WeeklyHours>(() => calendar?.weekly_hours ?? defaultWeek());
  const [holidays, setHolidays] = useState<Holiday[]>(() => calendar?.holidays ?? []);
  const [isDefault, setIsDefault] = useState(calendar?.is_default ?? isFirst);
  const [error, setError] = useState<string | null>(null);

  // Every zone with its offset now, built once per sheet. A stored zone this browser does not
  // know is still offered so the picker never looks empty.
  const allZones = useMemo<ComboboxOption[]>(() => timezoneList().map((z) => ({ value: z, label: z, hint: zoneOffset(z) })), []);
  const zoneOptions = allZones.some((o) => o.value === timezone) ? allZones : [...allZones, { value: timezone, label: timezone }];

  const submit = async () => {
    setError(null);
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 100) return setError(t("slaCalendars.nameRequired"));
    const problem = weekProblem(week);
    if (problem?.kind === "empty") return setError(t("slaCalendars.weekEmpty"));
    if (problem) {
      const day = t(`slaCalendars.day.${problem.day}`);
      return setError(problem.kind === "range" ? t("slaCalendars.periodInvalid", { day }) : t("slaCalendars.periodOverlap", { day }));
    }
    if (holidayProblem(holidays) >= 0) return setError(t("slaCalendars.holidayInvalid"));
    // Closed days are sent as empty lists so an update clears them.
    const weekly: WeeklyHours = Object.fromEntries(WEEKDAYS.map((d): [Weekday, WorkInterval[]] => [d, week[d] ?? []]));
    const data = {
      name: trimmed,
      timezone,
      weekly_hours: weekly,
      holidays: holidays.map((h) => ({ date: h.date, name: h.name.trim(), ...(h.moon_dependent ? { moon_dependent: true } : {}) })),
      is_default: isDefault,
    };
    try {
      await save.mutateAsync({ id: calendar?.id, data });
      toast.success(calendar ? t("slaCalendars.updated") : t("slaCalendars.created"));
      onOpenChange(false);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      if (status === 409) setError(t("slaCalendars.nameTaken"));
      else if (status === 400 && message) setError(t("slaCalendars.rejected", { reason: message }));
      else setError(t("slaCalendars.saveFailed"));
    }
  };

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={calendar ? t("slaCalendars.editNamed", { name: calendar.name }) : t("slaCalendars.newTitle")}
      description={isFirst && !calendar ? t("slaCalendars.firstHint") : t("slaCalendars.sheetHint")}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
            {t("common.cancel")}
          </Button>
          <Button onClick={() => void submit()} disabled={save.isPending}>
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {calendar ? t("common.saveChanges") : t("slaCalendars.create")}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("slaCalendars.colName")} htmlFor="cal-name" required>
            <Input
              id="cal-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("slaCalendars.namePlaceholder")}
              maxLength={100}
            />
          </Field>
          <Field label={t("slaCalendars.colTimezone")} required>
            <SearchableCombobox
              options={zoneOptions}
              value={timezone}
              onChange={(v) => v && setTimezone(v)}
              clearable={false}
              searchPlaceholder={t("slaCalendars.searchZone")}
              emptyText={t("slaCalendars.noZone")}
            />
          </Field>
        </div>
        <SwitchField
          label={t("slaCalendars.makeDefault")}
          description={t("slaCalendars.makeDefaultHint")}
          checked={isDefault}
          onChange={setIsDefault}
        />
        <WeekHoursEditor week={week} onChange={setWeek} />
        <HolidayEditor holidays={holidays} onChange={setHolidays} />
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    </FormSheet>
  );
}
