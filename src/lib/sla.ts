// SLA helpers shared by the admin pages and the ticket panel: duration wording, the policy
// settings kept in metadata, weekday keys and the timezone list.
import type { Translate } from "@/lib/i18n";
import type {
  EscalationRule,
  SLAPolicyMetadata,
  Weekday,
  WeeklyHours,
  WorkInterval,
} from "@/types/sla";

/** Limits the API enforces on policy settings (clock.MaxLeadMinutes, clock.MaxEscalationRules). */
export const MAX_LEAD_MINUTES = 7 * 24 * 60;
export const MAX_ESCALATION_RULES = 5;

/** The longest report window the API accepts, in days. */
export const MAX_REPORT_DAYS = 366;

/** Monday first, as a support desk reads its week. */
export const WEEKDAYS: Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export const DEFAULT_TIMEZONE = "Africa/Nairobi";

/** Monday to Friday, 08:00 to 17:00, the API's default week. */
export function defaultWeek(): WeeklyHours {
  const day = (): WorkInterval[] => [{ start: "08:00", end: "17:00" }];
  return { mon: day(), tue: day(), wed: day(), thu: day(), fri: day() };
}

/** 90 reads "1h 30m" and 1500 "1d 1h" in the active language; nothing measured reads "-". */
export function formatMinutes(total: number | null | undefined, t: Translate): string {
  if (total == null || Number.isNaN(total) || total < 0) return "-";
  const whole = Math.round(total);
  if (whole === 0) return t("time.minuteShort", { n: 0 });
  const d = Math.floor(whole / 1440);
  const h = Math.floor((whole % 1440) / 60);
  const m = whole % 60;
  const parts: string[] = [];
  if (d) parts.push(t("time.dayShort", { n: d }));
  if (h) parts.push(t("time.hourShort", { n: h }));
  if (m) parts.push(t("time.minuteShort", { n: m }));
  return parts.join(" ");
}

/** The SLA settings of a policy, typed, with the API's defaults for missing keys. */
export interface SLASettings {
  notifyBeforeBreachMin: number;
  pauseOnPendingInternal: boolean;
  escalationRules: EscalationRule[];
}

export function readSettings(meta: SLAPolicyMetadata | undefined): SLASettings {
  const notify = meta?.notify_before_breach_min;
  const rules = meta?.escalation_rules;
  return {
    notifyBeforeBreachMin: typeof notify === "number" ? notify : 0,
    pauseOnPendingInternal: meta?.pause_on_pending_internal === true,
    escalationRules: Array.isArray(rules) ? rules : [],
  };
}

/**
 * The metadata to send: the stored keys this screen does not edit are kept, because an update
 * replaces the metadata as a whole.
 */
export function writeSettings(meta: SLAPolicyMetadata | undefined, s: SLASettings): SLAPolicyMetadata {
  return {
    ...(meta ?? {}),
    notify_before_breach_min: s.notifyBeforeBreachMin,
    pause_on_pending_internal: s.pauseOnPendingInternal,
    escalation_rules: s.escalationRules.map((r) => ({
      target: r.target,
      when: r.when,
      minutes: r.minutes,
      ...(r.raise_priority ? { raise_priority: true } : {}),
      ...(r.team_id ? { team_id: r.team_id } : {}),
    })),
  };
}

/** A date as YYYY-MM-DD in the browser's zone. */
export function isoDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Today as YYYY-MM-DD, to tell coming holidays from past ones and to default report dates. */
export function todayISO(): string {
  return isoDate(new Date());
}

/** Minutes since midnight of "HH:MM", or NaN. "24:00" is the end of the day. */
export function clockMinutes(v: string): number {
  const m = /^(\d{2}):(\d{2})$/.exec(v);
  if (!m) return NaN;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 24 || min > 59 || (h === 24 && min !== 0)) return NaN;
  return h * 60 + min;
}

/** Working minutes in one week of the calendar. */
export function weeklyMinutes(week: WeeklyHours): number {
  let total = 0;
  for (const day of WEEKDAYS) {
    for (const iv of week[day] ?? []) {
      const span = clockMinutes(iv.end) - clockMinutes(iv.start);
      if (span > 0) total += span;
    }
  }
  return total;
}

/** Every IANA zone the browser knows, Africa/Nairobi first. */
export function timezoneList(): string[] {
  let zones: string[] = [];
  try {
    zones = Intl.supportedValuesOf("timeZone");
  } catch {
    zones = [];
  }
  return [DEFAULT_TIMEZONE, ...zones.filter((z) => z !== DEFAULT_TIMEZONE)];
}

/** "GMT+3" for a zone now, or an empty string when the browser cannot say. */
export function zoneOffset(zone: string): string {
  try {
    const part = new Intl.DateTimeFormat("en", { timeZone: zone, timeZoneName: "shortOffset" })
      .formatToParts(new Date())
      .find((p) => p.type === "timeZoneName");
    return part?.value ?? "";
  } catch {
    return "";
  }
}
