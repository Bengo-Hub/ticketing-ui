import { api } from "@/lib/api-client";
import type {
  CreateArticleData,
  KBArticle,
  KBListParams,
  KBListResponse,
  UpdateArticleData,
} from "@/types/kb";

// Staff routes under /kb/admin (sign-in and the kb permissions, every status and visibility).
// Reading the public knowledge base goes through lib/api/public-kb.ts, which only ever sees
// published, public articles.

/** One keyset page of the tenant's articles, newest first. Pass `next_cursor` back as `cursor`. */
export async function getAdminArticles(params: KBListParams, signal?: AbortSignal): Promise<KBListResponse> {
  const { tenantSlug, ...rest } = params;
  const { data } = await api.get<KBListResponse>(`api/v1/${tenantSlug}/kb/admin/articles`, {
    params: rest,
    signal,
  });
  return data;
}

export async function getAdminArticle(tenantSlug: string, id: string): Promise<KBArticle> {
  const { data } = await api.get<KBArticle>(`api/v1/${tenantSlug}/kb/admin/articles/${id}`);
  return data;
}

export async function createArticle(
  tenantSlug: string,
  payload: CreateArticleData,
): Promise<KBArticle> {
  const { data } = await api.post<KBArticle>(`api/v1/${tenantSlug}/kb/admin/articles`, payload);
  return data;
}

export async function updateArticle(
  tenantSlug: string,
  id: string,
  payload: UpdateArticleData,
): Promise<KBArticle> {
  const { data } = await api.put<KBArticle>(
    `api/v1/${tenantSlug}/kb/admin/articles/${id}`,
    payload,
  );
  return data;
}

export async function deleteArticle(tenantSlug: string, id: string): Promise<void> {
  await api.delete(`api/v1/${tenantSlug}/kb/admin/articles/${id}`);
}
