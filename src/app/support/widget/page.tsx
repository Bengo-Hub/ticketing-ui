"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { LanguageSwitch } from "@/components/common/language-switch";
import { CreateTicketForm } from "@/components/support/create-ticket-form";
import { useT } from "@/hooks/useT";
import { parseForcedTheme, setForcedTheme } from "@/lib/forced-theme";

/**
 * /support/widget?tenant=<slug>&theme=light|dark. The public create-ticket flow, email code
 * included, in a compact layout for the iframe public/widget.js opens. Without `theme` it follows
 * the visitor's device. The loader draws its close button over the top right corner, so the
 * header keeps that corner clear.
 */
export default function WidgetPage() {
  return (
    <Suspense fallback={null}>
      <Widget />
    </Suspense>
  );
}

function Widget() {
  const { t } = useT();
  const params = useSearchParams();
  const theme = parseForcedTheme(params.get("theme"));

  // An external store write, not component state: the root ThemeProvider reads it as forcedTheme.
  useEffect(() => {
    setForcedTheme(theme);
    return () => setForcedTheme(undefined);
  }, [theme]);

  return (
    <>
      <header className="flex items-center gap-3 border-b border-border bg-card py-2 pl-4 pr-14">
        <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{t("support.pageTitle")}</h1>
        <LanguageSwitch />
      </header>
      <main className="px-4 py-4">
        <CreateTicketForm compact />
      </main>
    </>
  );
}
