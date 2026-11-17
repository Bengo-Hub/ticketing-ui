"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { FilePen } from "lucide-react";
import { AiAdvisory, AiButton, AiCreditHint, AiError } from "@/components/ai/AiStatus";
import { useAiAction } from "@/hooks/useAI";
import { useT } from "@/hooks/useT";
import { draftArticle } from "@/lib/api/ai";
import { orgRoute } from "@/lib/utils";

/**
 * "Draft KB article" on a resolved or closed ticket. marketflow-ai writes a general how-to from the
 * public thread and ticketing-api saves it as a private draft; a person reviews and publishes it in
 * the KB editor. Repeating the same click returns the same draft instead of saving a second one.
 */
export function DraftArticle({
  orgSlug,
  ticketId,
  exempt,
  canOpenEditor,
}: {
  orgSlug: string;
  ticketId: string;
  exempt: boolean;
  /** The KB editor needs ticketing.kb.manage. */
  canOpenEditor: boolean;
}) {
  const { t } = useT();
  const qc = useQueryClient();
  const action = useAiAction(
    (key) => draftArticle(orgSlug, ticketId, key),
    () => void qc.invalidateQueries({ queryKey: ["kb", "admin-articles"] }),
  );
  const result = action.data;
  const article = result?.article;

  return (
    <section aria-label={t("ai.draft.title")} className="space-y-3 rounded-xl border border-border bg-card p-4">
      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <FilePen className="h-3.5 w-3.5" />
        {t("ai.draft.title")}
      </h2>
      <p className="text-xs text-muted-foreground">{t("ai.draft.hint")}</p>
      <div className="flex flex-wrap items-center gap-2">
        <AiButton pending={action.isPending} onClick={action.start} disabled={!!article}>
          {t("ai.draft.action")}
        </AiButton>
        <AiCreditHint credits={action.isPending ? undefined : result?.credits} exempt={exempt} />
      </div>
      <AiError failure={action.failure} onRetry={action.retry} />
      {article && !action.failure && (
        <div className="space-y-2 rounded-lg border border-success/30 bg-success/5 p-3 text-sm">
          <p className="font-medium">{t("ai.draft.created", { title: article.title })}</p>
          {canOpenEditor ? (
            <Link href={orgRoute(orgSlug, `/admin/kb/${article.id}`)} className="text-xs font-medium text-primary hover:underline">
              {t("ai.draft.open")}
            </Link>
          ) : (
            <p className="text-xs text-muted-foreground">{t("ai.draft.askEditor")}</p>
          )}
          <AiAdvisory notes={result.review_notes} tainted={result.tainted} stoppedEarly={result.run?.stopped_early} />
        </div>
      )}
    </section>
  );
}
