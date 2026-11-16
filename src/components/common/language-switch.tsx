"use client";

import { useEffect } from "react";
import { Languages } from "lucide-react";
import { useT } from "@/hooks/useT";
import { LOCALES, LOCALE_NAME, loadStoredLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Loads the language saved in this browser once the page has mounted. Mounted once in the root layout. */
export function LocaleSync() {
  useEffect(() => {
    loadStoredLocale();
  }, []);
  return null;
}

/**
 * English and Kiswahili side by side, the active one highlighted. The choice is remembered in
 * this browser. Short codes keep it narrow enough for a phone header.
 */
export function LanguageSwitch({ className }: { className?: string }) {
  const { t, locale, setLocale } = useT();
  return (
    <div
      role="group"
      aria-label={t("common.language")}
      className={cn("inline-flex items-center gap-0.5 rounded-xl border border-border bg-card p-0.5 text-xs", className)}
    >
      <Languages className="mx-1 hidden h-3.5 w-3.5 text-muted-foreground sm:block" aria-hidden />
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={locale === l}
          title={LOCALE_NAME[l]}
          aria-label={LOCALE_NAME[l]}
          onClick={() => setLocale(l)}
          className={cn(
            "min-h-8 rounded-lg px-2 font-semibold uppercase transition-colors",
            locale === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
