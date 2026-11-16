"use client";

import { LanguageSwitch } from "@/components/common/language-switch";
import { useT } from "@/hooks/useT";

/** Top bar of the public support pages: the page name and the language switch. */
export function SupportHeader() {
  const { t } = useT();
  return (
    <header className="border-b border-border bg-card shadow-sm">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <h1 className="min-w-0 truncate text-lg font-semibold text-foreground">{t("support.pageTitle")}</h1>
        <LanguageSwitch />
      </div>
    </header>
  );
}
