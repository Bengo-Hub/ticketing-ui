"use client";

import { AlertTriangle, ExternalLink, Loader2, RotateCcw, ShieldAlert, Sparkles } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/base";
import { useT } from "@/hooks/useT";
import type { AiFailure } from "@/hooks/useAI";
import { AI_CREDITS_URL } from "@/lib/subscriptions";
import { cn } from "@/lib/utils";
import type { AiCredits } from "@/types/ai";

/** An AI button: a sparkle while idle, a spinner while the request runs. */
export function AiButton({
  pending,
  children,
  className,
  disabled,
  ...props
}: ButtonProps & { pending: boolean }) {
  return (
    <Button type="button" variant="outline" size="sm" {...props} disabled={pending || disabled} className={cn("gap-1.5", className)}>
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-primary" />}
      {children}
    </Button>
  );
}

/**
 * The cost line beside an AI button. Before a request it says one credit will be used; after it,
 * what the answer cost. Nothing shows for the platform owner or an answer marked exempt.
 */
export function AiCreditHint({
  credits,
  exempt,
  className,
}: {
  credits?: AiCredits;
  /** The caller is the platform owner, known before any request. */
  exempt?: boolean;
  className?: string;
}) {
  const { t } = useT();
  if (exempt || credits?.exempt) return null;
  const text = !credits ? t("ai.usesCredit") : credits.replayed || credits.charged === 0 ? t("ai.notChargedAgain") : t("ai.creditUsed");
  return <span className={cn("text-xs text-muted-foreground", className)}>{text}</span>;
}

/**
 * Why an AI request failed, inline under its own button. Out of credits links to the billing page
 * where AI credits are bought; an outage offers a retry with the same request key.
 */
export function AiError({ failure, onRetry }: { failure: AiFailure | null; onRetry?: () => void }) {
  const { t } = useT();
  if (!failure) return null;
  if (failure === "credits") {
    return (
      <div role="status" className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs">
        <span className="font-medium">{t("ai.outOfCredits")}</span>
        <a href={AI_CREDITS_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
          {t("ai.buyCredits")} <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    );
  }
  const text =
    failure === "unavailable" ? t("ai.unavailable") : failure === "notResolved" ? t("ai.draft.notResolved") : t("ai.failed");
  return (
    <div role="status" className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs">
      <span className="text-muted-foreground">{text}</span>
      {onRetry && failure !== "notResolved" && (
        <button type="button" onClick={onRetry} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
          <RotateCcw className="h-3 w-3" /> {t("common.retry")}
        </button>
      )}
    </div>
  );
}

/**
 * Advice that comes with AI text: marketflow-ai's figure and commitment checks ("Check before
 * sending"), a warning when the text came from untrusted ticket content, and a note when the run
 * stopped early. Advisory only; it never blocks using the text.
 */
export function AiAdvisory({
  notes,
  tainted,
  stoppedEarly,
}: {
  notes?: string[];
  tainted?: boolean;
  stoppedEarly?: boolean;
}) {
  const { t } = useT();
  const list = (notes ?? []).filter((n) => n.trim() !== "");
  if (list.length === 0 && !tainted && !stoppedEarly) return null;
  return (
    <div className="space-y-2 text-xs">
      {tainted && (
        <p className="flex items-start gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {t("ai.tainted")}
        </p>
      )}
      {stoppedEarly && <p className="text-muted-foreground">{t("ai.stoppedEarly")}</p>}
      {list.length > 0 && (
        <div className="rounded-lg border border-warning/40 bg-warning/5 px-3 py-2">
          <p className="mb-1 flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="h-3.5 w-3.5 text-warning" />
            {t("ai.checkBeforeSending")}
          </p>
          <ul className="list-disc space-y-0.5 pl-5 text-muted-foreground">
            {list.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
