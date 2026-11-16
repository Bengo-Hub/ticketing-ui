"use client";

import { Eye, Keyboard } from "lucide-react";
import { useT } from "@/hooks/useT";
import { cn } from "@/lib/utils";
import type { PresenceEntry } from "@/types/workspace";

/** At most this many names are listed; the rest are counted. */
const MAX_NAMES = 3;

/**
 * The collision warning on a ticket: who else has it open, and who is writing a reply, so two
 * agents do not answer the customer twice. Someone typing shows in the warning colour.
 */
export function PresenceBanner({ others }: { others: PresenceEntry[] }) {
  const { t } = useT();
  if (others.length === 0) return null;
  const shown = others.slice(0, MAX_NAMES);
  const typing = others.some((e) => e.state === "typing");
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "mb-4 space-y-1 rounded-xl border px-4 py-2.5 text-sm",
        typing ? "border-warning/40 bg-warning/10" : "border-primary/20 bg-primary/5",
      )}
    >
      {shown.map((e) => (
        <p key={e.user_id} className="flex min-w-0 items-center gap-2">
          {e.state === "typing" ? (
            <Keyboard className="h-4 w-4 shrink-0 text-warning" />
          ) : (
            <Eye className="h-4 w-4 shrink-0 text-primary" />
          )}
          <span className="min-w-0 truncate">
            {e.state === "typing"
              ? t("presence.typing", { name: e.name || t("presence.someone") })
              : t("presence.viewing", { name: e.name || t("presence.someone") })}
          </span>
        </p>
      ))}
      {others.length > MAX_NAMES && (
        <p className="text-xs text-muted-foreground">{t("presence.more", { n: others.length - MAX_NAMES })}</p>
      )}
    </div>
  );
}
