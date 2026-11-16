import en from "../../messages/en.json";
import sw from "../../messages/sw.json";
import { format, type MessageVars } from "@/lib/template";

export { format, type MessageVars };

/**
 * Every user-facing string lives in messages/en.json and messages/sw.json, the hadia-ui layout
 * with no i18n library. `translate(locale, "tickets.title")` looks a string up by its dotted
 * path and fills `{name}` placeholders. Keys are checked by the compiler, and the Swahili file
 * is typed as the English one, so a key missing from either fails type-check.
 *
 * The chosen language is kept per browser in localStorage. It lives in a small module store so
 * plain helpers (dates, relative times) can read it, and components follow it through useT().
 * The store starts in English on the server and on the first client render, and loads the saved
 * choice after mount, so hydration always matches.
 */
export type Messages = typeof en;

type Leaves<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

export type MessageKey = Leaves<Messages>;

export const LOCALES = ["en", "sw"] as const;
export type Locale = (typeof LOCALES)[number];

const CATALOGUES: Record<Locale, Messages> = { en, sw };

/** The Intl locale each language formats dates with. */
export const DATE_LOCALE: Record<Locale, string> = { en: "en-KE", sw: "sw-KE" };

/** Each language named in itself, for the switch. */
export const LOCALE_NAME: Record<Locale, string> = { en: "English", sw: "Kiswahili" };

const STORAGE_KEY = "tkt_locale";

function lookup(locale: Locale, key: string): string | undefined {
  let node: unknown = CATALOGUES[locale];
  for (const part of key.split(".")) {
    if (node && typeof node === "object" && part in node) node = (node as Record<string, unknown>)[part];
    else return undefined;
  }
  return typeof node === "string" ? node : undefined;
}

export function translate(locale: Locale, key: MessageKey, vars?: MessageVars): string {
  return format(lookup(locale, key) ?? lookup("en", key) ?? key, vars);
}

export type Translate = (key: MessageKey, vars?: MessageVars) => string;

// The locale store.

let current: Locale = "en";
const listeners = new Set<() => void>();

function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

export function getLocale(): Locale {
  return current;
}

export function subscribeLocale(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function apply(next: Locale) {
  if (next === current) return;
  current = next;
  if (typeof document !== "undefined") document.documentElement.lang = next;
  listeners.forEach((l) => l());
}

export function setLocale(next: Locale) {
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Private windows and blocked storage still switch for this visit.
  }
  apply(next);
}

/** Loads the saved choice. Called once after mount by LocaleSync. */
export function loadStoredLocale() {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch {
    saved = null;
  }
  apply(isLocale(saved) ? saved : "en");
}

// Plain helpers that follow the active language.

/** "just now", "5 min ago", "3 h ago", "2 days ago", then the date. */
export function relativeTime(dateStr: string, formatDate: (v: string) => string): string {
  if (!dateStr) return "-";
  const minutes = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60_000);
  if (minutes < 1) return translate(current, "time.justNow");
  if (minutes < 60) return translate(current, "time.minutesAgo", { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return translate(current, "time.hoursAgo", { n: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return translate(current, "time.daysAgo", { n: days });
  return formatDate(dateStr);
}
