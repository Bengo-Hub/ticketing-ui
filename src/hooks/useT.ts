"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  getLocale,
  setLocale,
  subscribeLocale,
  translate,
  type Locale,
  type MessageKey,
  type MessageVars,
  type Translate,
} from "@/lib/i18n";

const serverLocale = (): Locale => "en";

/** The active language, a translate function bound to it, and the setter the switch uses. */
export function useT(): { t: Translate; locale: Locale; setLocale: (next: Locale) => void } {
  const locale = useSyncExternalStore(subscribeLocale, getLocale, serverLocale);
  const t = useCallback((key: MessageKey, vars?: MessageVars) => translate(locale, key, vars), [locale]);
  return { t, locale, setLocale };
}
