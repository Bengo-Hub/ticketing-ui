/**
 * The public knowledge base: ticketing-api's no sign-in KB routes under /api/v1/{tenant}/kb.
 * They only ever return the tenant's published, public articles, and are rate limited per
 * tenant and IP. Plain fetch through public-support's helpers, not the shared axios client, so a
 * public page never sends a signed-in user's token or tenant headers.
 *
 * Suggestions are a plain database search for the support forms (no AI, no credits).
 */
import { NORMALISED_BASE_URL } from "@/lib/api-client";
import { publicGet, publicPost } from "@/lib/api/public-support";
import type { KBCategory, PublicKBArticle, PublicKBListResponse } from "@/types/kb";

function kbURL(tenantSlug: string, path: string, query?: Record<string, string | number | undefined>): string {
  const url = `${NORMALISED_BASE_URL}api/v1/${encodeURIComponent(tenantSlug)}/kb${path}`;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== "") params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

export interface PublicKBListParams {
  search?: string;
  category?: string;
  cursor?: string;
  limit?: number;
}

/** One keyset page of the public articles, newest first, without bodies. */
export function listPublicArticles(
  tenantSlug: string,
  params: PublicKBListParams,
  signal?: AbortSignal,
): Promise<PublicKBListResponse> {
  return publicGet<PublicKBListResponse>(kbURL(tenantSlug, "/articles", { ...params }), signal);
}

/**
 * A published public article with its sanitised HTML body. Each read counts a view (the server's
 * cached read in public-kb-server.ts asks with count_view=false instead).
 */
export function getPublicArticle(tenantSlug: string, slug: string, signal?: AbortSignal): Promise<PublicKBArticle> {
  return publicGet<PublicKBArticle>(kbURL(tenantSlug, `/articles/${encodeURIComponent(slug)}`), signal);
}

/** The public categories with their article counts, by name. */
export async function getPublicCategories(tenantSlug: string, signal?: AbortSignal): Promise<KBCategory[]> {
  const res = await publicGet<{ data?: KBCategory[] }>(kbURL(tenantSlug, "/categories"), signal);
  return res.data ?? [];
}

/** Up to five public articles for a ticket subject, best first. No AI and no credits. */
export async function suggestPublicArticles(
  tenantSlug: string,
  subject: string,
  limit = 5,
  signal?: AbortSignal,
): Promise<PublicKBArticle[]> {
  const res = await publicGet<{ data?: PublicKBArticle[] }>(kbURL(tenantSlug, "/suggestions", { q: subject, limit }), signal);
  return res.data ?? [];
}

/** Records a helpful or not helpful vote. */
export async function votePublicArticle(tenantSlug: string, id: string, helpful: boolean): Promise<void> {
  await publicPost(kbURL(tenantSlug, `/articles/${encodeURIComponent(id)}/vote`), { helpful });
}

/**
 * Counts one view of an article the page read without counting (the server's cached read). Called
 * once per page view from the visitor's browser, so the API limits it per visitor.
 */
export async function recordPublicArticleView(tenantSlug: string, id: string): Promise<void> {
  await publicPost(kbURL(tenantSlug, `/articles/${encodeURIComponent(id)}/view`), {});
}

/** The public help center link for a tenant, optionally to one article. */
export function helpCenterHref(tenantSlug: string, articleSlug?: string): string {
  const org = `org=${encodeURIComponent(tenantSlug)}`;
  return articleSlug ? `/support/kb/${encodeURIComponent(articleSlug)}?${org}` : `/support/kb?${org}`;
}
