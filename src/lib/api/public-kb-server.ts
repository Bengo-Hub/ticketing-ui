/**
 * Server-only reads of the public knowledge base for the help center pages.
 *
 * Why this exists: the article page reads the article on this server (for its title, description
 * and indexing), so every visitor's read used to reach ticketing-api from this server's address.
 * ticketing-api limits public reads per tenant and client IP, so all visitors shared one bucket and
 * a busy article or a crawler could make the page fail for everyone. Two things fix that.
 *
 * 1. A short page cache. The article is kept in Next's data cache for ARTICLE_REVALIDATE_SECONDS
 *    under the tenant and slug alone, so repeat views and crawlers mostly never reach the API.
 *    Only a 200 is kept; a 404, 429 or 5xx answers this visit and is asked again next time.
 * 2. The visitor's own address on a miss. The read behind a miss carries the visitor's IP in
 *    X-Visitor-IP with the shared key in X-Visitor-IP-Key (VISITOR_IP_FORWARD_KEY, server only).
 *    ticketing-api trusts the address only with that key, so the visitor whose view missed pays
 *    from their own limit and a cached answer costs nobody. Without the key the header is not sent
 *    and the API sees this server, as before.
 *
 * The cached read asks with count_view=false, so a cache miss is not a view. The page counts the
 * view from the visitor's browser instead (recordPublicArticleView), once per page view.
 *
 * Import this from server components only: it reads request headers and a server secret.
 */
import { unstable_cache } from "next/cache";
import { headers } from "next/headers";
import { isIP } from "node:net";
import { NORMALISED_BASE_URL } from "@/lib/api-client";
import type { PublicKBArticle } from "@/types/kb";

/** How long an article stays cached on this server. An edit or unpublish shows within this. */
export const ARTICLE_REVALIDATE_SECONDS = 60;
const READ_TIMEOUT_MS = 8_000;

/**
 * The API base for server-side reads: API_INTERNAL_URL (the in-cluster service) when set, so the
 * read does not loop out through Cloudflare, else the public API URL. Ends with a slash.
 */
function serverApiBase(): string {
  const internal = (process.env.API_INTERNAL_URL ?? "").trim();
  if (!internal) return NORMALISED_BASE_URL;
  return internal.endsWith("/") ? internal : `${internal}/`;
}

/**
 * The visitor's address and the forwarding key, or nothing when the key is not configured or the
 * address is not a valid IP. The address is the X-Real-IP that the ingress in front of this app
 * set from Cloudflare's CF-Connecting-IP (the ingress overwrites any value the browser sent).
 */
async function visitorIpHeaders(): Promise<Record<string, string>> {
  const key = process.env.VISITOR_IP_FORWARD_KEY ?? "";
  if (!key) return {};
  const h = await headers();
  const ip = (h.get("x-real-ip") ?? h.get("cf-connecting-ip") ?? "").trim();
  return isIP(ip) ? { "X-Visitor-IP": ip, "X-Visitor-IP-Key": key } : {};
}

/** A non-200 answer, thrown out of the cached function so Next never keeps it. */
class NotKept extends Error {
  constructor(readonly status: number) {
    super(`ticketing-api answered ${status}`);
  }
}

/**
 * The published, public article for the help center page, or null when the API does not return
 * it (unknown, draft, private, rate limited or unreachable). Does not count a view.
 */
export async function getCachedPublicArticle(org: string, slug: string): Promise<PublicKBArticle | null> {
  if (!org || !slug) return null;
  // Read outside the cached function: request data cannot be read inside it. The headers are not
  // part of the cache key, so every visitor shares one cached copy.
  const visitor = await visitorIpHeaders();
  const load = unstable_cache(
    async (): Promise<PublicKBArticle> => {
      const url = `${serverApiBase()}api/v1/${encodeURIComponent(org)}/kb/articles/${encodeURIComponent(slug)}?count_view=false`;
      const res = await fetch(url, {
        headers: { Accept: "application/json", ...visitor },
        cache: "no-store",
        signal: AbortSignal.timeout(READ_TIMEOUT_MS),
      });
      if (res.status !== 200) throw new NotKept(res.status);
      return (await res.json()) as PublicKBArticle;
    },
    ["public-kb-article", org, slug],
    { revalidate: ARTICLE_REVALIDATE_SECONDS },
  );
  try {
    return await load();
  } catch {
    return null;
  }
}
