"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Eye, LifeBuoy, ThumbsDown, ThumbsUp } from "lucide-react";
import { usePublicArticle, useVotePublicArticle } from "@/hooks/useKB";
import { useT } from "@/hooks/useT";
import { RichTextView } from "@/components/common/rich-text";
import { Button, Card, CardContent } from "@/components/ui/base";
import { formatDate } from "@/lib/utils";
import type { PublicKBArticle } from "@/types/kb";

/**
 * One public article, shared by the public help center and the signed-in reading page. The body
 * is HTML the API sanitised on save (httpware/richtext), shown through RichTextView's allow-list
 * as well. A visitor votes once per page view; the counts update in place, since a refetch would
 * count another view.
 */
export function HelpArticle({
  tenantSlug,
  slug,
  initial,
  backHref,
  contactHref,
}: {
  tenantSlug: string;
  slug: string;
  /** The article the server already read for the page title, so the view counts once. */
  initial?: PublicKBArticle | null;
  backHref: string;
  /** Where "Still need help?" leads; hidden when absent. */
  contactHref?: string;
}) {
  const { t } = useT();
  const query = usePublicArticle(tenantSlug, slug, initial);
  const vote = useVotePublicArticle(tenantSlug);
  const [voted, setVoted] = useState(false);
  const [voteError, setVoteError] = useState(false);
  const article = query.data;

  const back = (
    <Link
      href={backHref}
      className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      {t("helpCenter.backToList")}
    </Link>
  );

  if (query.isError) {
    return (
      <div className="space-y-4">
        {back}
        <div role="alert" className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{t("helpCenter.notFound")}</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  const onVote = (helpful: boolean) => {
    setVoteError(false);
    vote.mutate(
      { id: article.id, slug, helpful },
      { onSuccess: () => setVoted(true), onError: () => setVoteError(true) },
    );
  };

  return (
    <article className="space-y-6">
      {back}

      <header>
        {article.category && (
          <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-primary">{article.category}</span>
        )}
        <h1 className="text-2xl font-bold text-foreground wrap-break-word">{article.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>{t("helpCenter.updated", { date: formatDate(article.updated_at) })}</span>
          <span className="flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            {t("helpCenter.views", { n: article.view_count })}
          </span>
        </div>
        {article.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      <Card>
        <CardContent className="min-w-0 pt-6">
          <RichTextView value={article.content ?? ""} className="text-foreground" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          {voted ? (
            <p role="status" className="text-sm font-medium text-foreground">
              {t("helpCenter.thanks")}
            </p>
          ) : (
            <>
              <p className="text-sm font-medium text-foreground">{t("helpCenter.wasHelpful")}</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => onVote(true)} disabled={vote.isPending}>
                  <ThumbsUp className="h-3.5 w-3.5" /> {t("helpCenter.yes")}
                </Button>
                <Button variant="outline" size="sm" onClick={() => onVote(false)} disabled={vote.isPending}>
                  <ThumbsDown className="h-3.5 w-3.5" /> {t("helpCenter.no")}
                </Button>
              </div>
            </>
          )}
          {voteError && (
            <p role="alert" className="text-xs text-destructive">
              {t("helpCenter.voteFailed")}
            </p>
          )}
        </CardContent>
      </Card>

      {contactHref && (
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <LifeBuoy className="h-4 w-4" />
          {t("helpCenter.stillNeedHelp")}
          <Link href={contactHref} className="font-medium text-primary hover:underline">
            {t("helpCenter.contactUs")}
          </Link>
        </p>
      )}
    </article>
  );
}
