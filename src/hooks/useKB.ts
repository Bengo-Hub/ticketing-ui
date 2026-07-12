import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createArticle,
  deleteArticle,
  getAdminArticle,
  getAdminArticles,
  getArticle,
  getArticles,
  updateArticle,
  voteArticle,
} from "@/lib/api/kb";
import type { CreateArticleData, KBListParams, UpdateArticleData } from "@/types/kb";

// Public (no-auth) — used by the public KB pages.
export function useArticles(params: KBListParams) {
  return useQuery({
    queryKey: ["kb", "articles", params],
    queryFn: () => getArticles(params),
  });
}

export function useArticle(tenantSlug: string, id: string) {
  return useQuery({
    queryKey: ["kb", "article", tenantSlug, id],
    queryFn: () => getArticle(tenantSlug, id),
    enabled: !!id,
  });
}

// Staff/admin (auth required) — used by the admin KB pages, which must see
// every status (not just published) via the server-enforced /kb/admin path.
export function useAdminArticles(params: KBListParams) {
  return useQuery({
    queryKey: ["kb", "admin-articles", params],
    queryFn: () => getAdminArticles(params),
  });
}

export function useAdminArticle(tenantSlug: string, id: string) {
  return useQuery({
    queryKey: ["kb", "admin-article", tenantSlug, id],
    queryFn: () => getAdminArticle(tenantSlug, id),
    enabled: !!id,
  });
}

export function useCreateArticle(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateArticleData) => createArticle(tenantSlug, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kb", "articles"] });
      qc.invalidateQueries({ queryKey: ["kb", "admin-articles"] });
    },
  });
}

export function useUpdateArticle(tenantSlug: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateArticleData) => updateArticle(tenantSlug, id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kb", "articles"] });
      qc.invalidateQueries({ queryKey: ["kb", "article", tenantSlug, id] });
      qc.invalidateQueries({ queryKey: ["kb", "admin-articles"] });
      qc.invalidateQueries({ queryKey: ["kb", "admin-article", tenantSlug, id] });
    },
  });
}

export function useDeleteArticle(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteArticle(tenantSlug, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kb", "articles"] });
      qc.invalidateQueries({ queryKey: ["kb", "admin-articles"] });
    },
  });
}

export function useVoteArticle(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, helpful }: { id: string; helpful: boolean }) =>
      voteArticle(tenantSlug, id, helpful),
    onSuccess: (_, { id }) =>
      qc.invalidateQueries({ queryKey: ["kb", "article", tenantSlug, id] }),
  });
}
