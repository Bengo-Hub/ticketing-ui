"use client";

import { BookOpen, CheckCircle2, ExternalLink, Lightbulb } from "lucide-react";
import { useDebouncedValue } from "@bengo-hub/shared-ui-lib/search";
import { useSearchQuery } from "@bengo-hub/shared-ui-lib/search/query";
import { helpCenterHref, suggestPublicArticles, votePublicArticle } from "@/lib/api/public-kb";
import { Button } from "@/components/ui/base";
import { useT } from "@/hooks/useT";
import { cn } from "@/lib/utils";

/** The subject must be this long before it is searched. */
const MIN_SUBJECT = 5;

/**
 * Knowledge base deflection on the public support form and the widget. Once typing pauses, the
 * subject is searched against the tenant's published, public articles (ticketing-api's
 * suggestions route: a plain search, no AI and no credits) and up to five are shown. Articles
 * open in a new tab so the form keeps what was typed (inside the widget the help center cannot
 * be framed anyway). "This answered my question" counts a helpful vote and calls onAnswered, so
 * no ticket is sent; otherwise the visitor carries on with the form.
 */
export function KbDeflection({
  tenantSlug,
  subject,
  onAnswered,
  compact = false,
}: {
  /** The organisation the form is for; nothing is searched without it. */
  tenantSlug: string | null;
  subject: string;
  onAnswered: () => void;
  compact?: boolean;
}) {
  const { t } = useT();
  const debounced = useDebouncedValue(subject.trim());
  const term = tenantSlug && debounced.length >= MIN_SUBJECT ? debounced : "";
  const suggestions = useSearchQuery({
    queryKey: ["kb", "public-deflection", tenantSlug],
    term,
    allowEmpty: false,
    fetcher: (q, signal) => suggestPublicArticles(tenantSlug!, q, 5, signal),
  });
  const articles = term ? (suggestions.data ?? []) : [];
  if (!tenantSlug || !term || (!suggestions.isFetching && articles.length === 0)) return null;

  const answered = (id: string) => {
    // The vote is a signal for the KB editors only; the visitor is done either way.
    void votePublicArticle(tenantSlug, id, true).catch(() => undefined);
    onAnswered();
  };

  return (
    <section
      aria-live="polite"
      className={cn("space-y-3 rounded-xl border border-primary/30 bg-primary/5", compact ? "p-3" : "p-4")}
    >
      <p className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Lightbulb className="h-4 w-4 shrink-0 text-primary" />
        {t("helpCenter.suggestTitle")}
      </p>
      {suggestions.isFetching && articles.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("helpCenter.suggestLoading")}</p>
      ) : (
        <ul className="space-y-2">
          {articles.map((article) => (
            <li key={article.id} className="rounded-lg border border-border bg-card px-3 py-2">
              <a
                href={helpCenterHref(tenantSlug, article.slug)}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-2"
                aria-label={`${t("helpCenter.openArticle")}: ${article.title}`}
              >
                <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium wrap-break-word group-hover:text-primary">{article.title}</span>
                  {article.excerpt && (
                    <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{article.excerpt}</span>
                  )}
                </span>
                <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary" />
              </a>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-1 h-7 px-2 text-xs"
                onClick={() => answered(article.id)}
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> {t("helpCenter.answered")}
              </Button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">{t("helpCenter.continueSubmit")}</p>
    </section>
  );
}
