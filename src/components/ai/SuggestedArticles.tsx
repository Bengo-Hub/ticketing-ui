"use client";

import Link from "next/link";
import { BookOpen, ExternalLink, Link2, Lock } from "lucide-react";
import { toast } from "sonner";
import { AiAdvisory, AiButton, AiCreditHint, AiError } from "@/components/ai/AiStatus";
import { linkHtml } from "@/components/ai/html";
import { useAiAction } from "@/hooks/useAI";
import { useT } from "@/hooks/useT";
import { suggestArticles } from "@/lib/api/ai";
import { orgRoute } from "@/lib/utils";
import type { AiKBSuggestion } from "@/types/ai";

/**
 * "Suggested articles" beside a ticket: up to five of the tenant's published articles ranked by
 * marketflow-ai. A public article can be linked into the reply; a private one is for the agent
 * only, so it opens but is never offered for a customer reply.
 */
export function SuggestedArticles({
  orgSlug,
  ticketId,
  exempt,
  canManageKb,
  onInsert,
}: {
  orgSlug: string;
  ticketId: string;
  exempt: boolean;
  /** A private article opens in the KB editor, which needs ticketing.kb.manage. */
  canManageKb: boolean;
  /** Adds HTML to the reply editor; absent when the agent cannot reply on this ticket. */
  onInsert?: (html: string) => void;
}) {
  const { t } = useT();
  const action = useAiAction((key) => suggestArticles(orgSlug, ticketId, key));
  const result = action.data;
  const suggestions = [...(result?.suggestions ?? [])].sort((a, b) => a.rank - b.rank);

  const insert = (s: AiKBSuggestion) => {
    if (!onInsert) return;
    onInsert(linkHtml(`${window.location.origin}${orgRoute(orgSlug, `/kb/${s.slug}`)}`, s.title));
    toast.success(t("ai.articles.inserted"));
  };

  return (
    <section aria-label={t("ai.articles.title")} className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <BookOpen className="h-3.5 w-3.5" />
          {t("ai.articles.title")}
        </h2>
        <AiButton pending={action.isPending} onClick={action.start}>
          {result ? t("ai.articles.again") : t("ai.articles.action")}
        </AiButton>
      </div>
      <AiCreditHint credits={action.isPending ? undefined : result?.credits} exempt={exempt} className="block" />
      <AiError failure={action.failure} onRetry={action.retry} />

      {result && !action.failure && (
        <>
          {suggestions.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("ai.articles.none")}</p>
          ) : (
            <ul className="space-y-2">
              {suggestions.map((s) => (
                <li key={s.article_id} className="space-y-1.5 rounded-lg border border-border p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    {s.is_public || canManageKb ? (
                      <Link
                        href={orgRoute(orgSlug, s.is_public ? `/kb/${s.slug}` : `/admin/kb/${s.article_id}`)}
                        target="_blank"
                        className="group inline-flex min-w-0 items-start gap-1.5 text-sm font-medium hover:text-primary"
                      >
                        <span className="break-words">{s.title}</span>
                        <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground group-hover:text-primary" />
                      </Link>
                    ) : (
                      <span className="min-w-0 break-words text-sm font-medium">{s.title}</span>
                    )}
                    {!s.is_public && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                        <Lock className="h-3 w-3" /> {t("ai.articles.private")}
                      </span>
                    )}
                  </div>
                  {s.reason && <p className="text-xs text-muted-foreground">{s.reason}</p>}
                  {s.is_public && onInsert && (
                    <button
                      type="button"
                      onClick={() => insert(s)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      <Link2 className="h-3 w-3" /> {t("ai.articles.insert")}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <AiAdvisory notes={result.review_notes} tainted={result.tainted} stoppedEarly={result.run?.stopped_early} />
        </>
      )}
    </section>
  );
}
