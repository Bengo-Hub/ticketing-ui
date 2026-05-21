import { api } from "@/lib/api-client";
import type {
  CreateArticleData,
  KBArticle,
  KBListParams,
  KBListResponse,
  UpdateArticleData,
} from "@/types/kb";

export async function getArticles(params: KBListParams): Promise<KBListResponse> {
  const { tenantSlug, ...rest } = params;
  const { data } = await api.get<KBListResponse>(`api/v1/${tenantSlug}/kb/articles`, {
    params: rest,
  });
  return data;
}

export async function getArticle(tenantSlug: string, id: string): Promise<KBArticle> {
  const { data } = await api.get<KBArticle>(`api/v1/${tenantSlug}/kb/articles/${id}`);
  return data;
}

export async function createArticle(
  tenantSlug: string,
  payload: CreateArticleData,
): Promise<KBArticle> {
  const { data } = await api.post<KBArticle>(`api/v1/${tenantSlug}/kb/articles`, payload);
  return data;
}

export async function updateArticle(
  tenantSlug: string,
  id: string,
  payload: UpdateArticleData,
): Promise<KBArticle> {
  const { data } = await api.put<KBArticle>(`api/v1/${tenantSlug}/kb/articles/${id}`, payload);
  return data;
}

export async function deleteArticle(tenantSlug: string, id: string): Promise<void> {
  await api.delete(`api/v1/${tenantSlug}/kb/articles/${id}`);
}

export async function voteArticle(
  tenantSlug: string,
  id: string,
  helpful: boolean,
): Promise<void> {
  await api.post(`api/v1/${tenantSlug}/kb/articles/${id}/vote`, { helpful });
}

export async function searchPublicArticles(
  tenantSlug: string,
  search: string,
  limit = 5,
): Promise<KBArticle[]> {
  const { data } = await api.get<KBListResponse>(
    `api/v1/${tenantSlug}/kb/articles`,
    { params: { search, page_size: limit, status: "published" } },
  );
  return data.data ?? [];
}
