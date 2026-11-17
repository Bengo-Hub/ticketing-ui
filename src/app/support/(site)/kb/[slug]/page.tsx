import { cache } from "react";
import type { Metadata } from "next";
import { getCachedPublicArticle } from "@/lib/api/public-kb-server";
import type { PublicKBArticle } from "@/types/kb";
import { HelpArticleClient } from "./article-client";

/**
 * A public article: /support/kb/<slug>?org=<tenant>. The server reads the article for the page
 * title, description and indexing through a short cache (lib/api/public-kb-server), with the
 * visitor's own address on a miss so each visitor has their own rate limit bucket at
 * ticketing-api. That read does not count a view; the client view counts one per page view. A
 * published, public article is indexed; anything the API does not return (a draft, a private or
 * an unknown article) is not.
 */

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

async function orgOf(searchParams: Props["searchParams"]): Promise<string> {
  const sp = await searchParams;
  return (first(sp.org) || first(sp.tenant)).trim().toLowerCase();
}

/** One read per request: generateMetadata and the page share it. Null when not found. */
const loadArticle = cache(
  (org: string, slug: string): Promise<PublicKBArticle | null> => getCachedPublicArticle(org, slug),
);

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, org] = await Promise.all([params, orgOf(searchParams)]);
  const article = await loadArticle(org, decodeURIComponent(slug));
  if (!article) {
    return { title: "Help center", robots: { index: false, follow: false } };
  }
  const description = article.excerpt || undefined;
  return {
    title: article.title,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical: `/support/kb/${encodeURIComponent(article.slug)}?org=${encodeURIComponent(org)}` },
    openGraph: { title: article.title, description, type: "article" },
  };
}

export default async function HelpArticlePage({ params, searchParams }: Props) {
  const [{ slug }, org] = await Promise.all([params, orgOf(searchParams)]);
  const decoded = decodeURIComponent(slug);
  const article = await loadArticle(org, decoded);
  return <HelpArticleClient org={org} slug={decoded} initial={article} />;
}
