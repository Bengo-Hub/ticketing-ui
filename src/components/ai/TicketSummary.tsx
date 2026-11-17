"use client";

import { FileText } from "lucide-react";
import { AiAdvisory, AiButton, AiCreditHint, AiError } from "@/components/ai/AiStatus";
import { useAiAction } from "@/hooks/useAI";
import { useT } from "@/hooks/useT";
import { summarizeTicket } from "@/lib/api/ai";

/**
 * "Summarize" on the ticket detail: the thread summary from marketflow-ai, read from the ticket and
 * its newest messages, internal notes included. Each click is a new request and a new credit.
 */
export function TicketSummary({ orgSlug, ticketId, exempt }: { orgSlug: string; ticketId: string; exempt: boolean }) {
  const { t } = useT();
  const action = useAiAction((key) => summarizeTicket(orgSlug, ticketId, key));
  const result = action.data;

  return (
    <section aria-label={t("ai.summary.title")} className="space-y-3 rounded-xl border border-border bg-card p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <FileText className="h-4 w-4 text-primary" />
          {t("ai.summary.title")}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <AiCreditHint credits={action.isPending ? undefined : result?.credits} exempt={exempt} />
          <AiButton pending={action.isPending} onClick={action.start}>
            {result ? t("ai.summary.again") : t("ai.summary.action")}
          </AiButton>
        </div>
      </div>
      <AiError failure={action.failure} onRetry={action.retry} />
      {result && !action.failure && (
        <>
          <p className="whitespace-pre-line break-words text-sm leading-relaxed">{result.summary}</p>
          <AiAdvisory notes={result.review_notes} tainted={result.tainted} stoppedEarly={result.run?.stopped_early} />
        </>
      )}
      {!result && !action.failure && !action.isPending && (
        <p className="text-xs text-muted-foreground">{t("ai.summary.hint")}</p>
      )}
    </section>
  );
}
