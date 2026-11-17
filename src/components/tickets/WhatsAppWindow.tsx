"use client";

import { MessageCircle, TriangleAlert } from "lucide-react";
import { useNow } from "@/hooks/useNow";
import { useT } from "@/hooks/useT";
import type { Translate } from "@/lib/i18n";
import { cn, formatDateTime } from "@/lib/utils";

/** The window is called "closing soon" in its last hour. */
const SOON_MS = 60 * 60_000;

function timeLeft(ms: number, t: Translate): string {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return t("time.lessThanMinute");
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? t("time.hoursMinutes", { h: hours, m: minutes % 60 }) : t("time.minutes", { m: minutes });
}

/**
 * The WhatsApp 24-hour customer service window above a public reply. While it is open a reply
 * goes to WhatsApp as a free-form message; once it closes WhatsApp only takes approved templates,
 * so the reply reaches the customer by email if they have one, and otherwise waits until they
 * write again. The countdown follows the shared clock (useNow), so it refreshes on its own.
 */
export function WhatsAppWindow({ expiresAt, hasEmail }: { expiresAt: string | null; hasEmail: boolean }) {
  const { t } = useT();
  const now = useNow();
  const expires = expiresAt ? new Date(expiresAt).getTime() : NaN;
  const known = Number.isFinite(expires);
  const at = known ? formatDateTime(expiresAt as string) : "";

  // Before the clock is known (server render and hydration) only the closing time shows.
  if (known && now === 0) {
    return (
      <p className="flex items-start gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>{t("ticket.whatsapp.closesAt", { at })}</span>
      </p>
    );
  }

  const left = known ? expires - now : 0;
  if (known && left > 0) {
    const soon = left <= SOON_MS;
    return (
      <p
        role="status"
        className={cn(
          "flex items-start gap-2 rounded-lg border px-3 py-2 text-xs",
          soon
            ? "border-warning/40 bg-warning/10 text-warning"
            : "border-green-200 bg-green-50 text-green-800 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-300",
        )}
      >
        <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="min-w-0">
          <span className="font-semibold">{t("ticket.whatsapp.open")}</span>{" "}
          {t("ticket.whatsapp.closesIn", { left: timeLeft(left, t), at })}
        </span>
      </p>
    );
  }

  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
      <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <div className="min-w-0 space-y-0.5">
        <p className="font-semibold">
          {known ? t("ticket.whatsapp.closedAt", { at }) : t("ticket.whatsapp.notOpen")}
        </p>
        <p className="text-foreground/80">{hasEmail ? t("ticket.whatsapp.closedEmail") : t("ticket.whatsapp.closedNoEmail")}</p>
      </div>
    </div>
  );
}
