import type { CursorPage } from "@/types/tickets";

export type ArticleStatus = "draft" | "published" | "archived";

/** A full article, as the staff routes (/kb/admin) return it. */
export interface KBArticle {
  id: string;
  tenant_id: string;
  author_id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  status: ArticleStatus;
  is_public: boolean;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * What the public routes show of a published, public article (ticketing-api kb.PublicArticle).
 * `content` is set only on the article page, never in lists or suggestions.
 */
export interface PublicKBArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  content?: string;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  published_at?: string;
  updated_at: string;
}

/** A category of the public knowledge base and how many articles it holds. */
export interface KBCategory {
  name: string;
  count: number;
}

/** One keyset page of the staff list. */
export type KBListResponse = CursorPage<KBArticle>;

/** One keyset page of the public list. */
export type PublicKBListResponse = CursorPage<PublicKBArticle>;

/** Filters of a keyset article list; the cursor is the previous page's `next_cursor`. */
export interface KBListParams {
  tenantSlug: string;
  cursor?: string;
  limit?: number;
  search?: string;
  category?: string;
  status?: ArticleStatus;
}

export interface CreateArticleData {
  title: string;
  content: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
  status?: ArticleStatus;
  is_public?: boolean;
}

export interface UpdateArticleData {
  title?: string;
  content?: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
  status?: ArticleStatus;
  is_public?: boolean;
}
