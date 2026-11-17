"use client";

import { useEffect, useRef } from "react";
import { BookOpen } from "lucide-react";
import { HelpArticle } from "@/components/kb/help-article";
import { helpCenterHref, recordPublicArticleView } from "@/lib/api/public-kb";
import { useT } from "@/hooks/useT";
import type { PublicKBArticle } from "@/types/kb";

/**
 * The client side of a public article. `initial` is the server's cached read, which does not count
 * a view, so this counts the page view once from the visitor's browser. When the server could not
 * find it, the client asks once more (a cold start or a network blip), and that read counts the
 * view itself; it shows "not found" if the API agrees.
 */
export function HelpArticleClient({
  org,
  slug,
  initial,
}: {
  org: string;
  slug: string;
  initial: PublicKBArticle | null;
}) {
  const { t } = useT();
  const counted = useRef<string | null>(null);
  const articleId = initial?.id;
  useEffect(() => {
    if (!org || !articleId || counted.current === articleId) return;
    counted.current = articleId;
    // Best effort: a lost view must never disturb the reader.
    recordPublicArticleView(org, articleId).catch(() => {});
  }, [org, articleId]);

  if (!org) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card py-12 text-center">
        <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="px-4 text-sm text-muted-foreground">{t("helpCenter.orgMissing")}</p>
      </div>
    );
  }
  return (
    <HelpArticle
      tenantSlug={org}
      slug={slug}
      initial={initial}
      backHref={helpCenterHref(org)}
      contactHref={`/support?org=${encodeURIComponent(org)}`}
    />
  );
}
