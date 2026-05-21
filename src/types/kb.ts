export type ArticleStatus = "draft" | "published" | "archived";

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

export interface KBListResponse {
  data: KBArticle[];
  total: number;
  page: number;
  page_size: number;
}

export interface KBListParams {
  tenantSlug: string;
  page?: number;
  page_size?: number;
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
