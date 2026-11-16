"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchQuery } from "@bengo-hub/shared-ui-lib/search/query";
import {
  createArticle,
  deleteArticle,
  getAdminArticle,
  getAdminArticles,
  getArticleBySlug,
  getArticles,
  updateArticle,
  voteArticle,
} from "@/lib/api/kb";
import type { CreateArticleData, KBListParams, UpdateArticleData } from "@/types/kb";

// Public (no-auth), used by the public KB pages. The search term is debounced by the caller and
// a newer term aborts the older request.
export function useArticleSearch(params: Omit<KBListParams, "search">, term: string) {
  return useSearchQuery({
    queryKey: ["kb", "articles", params],
    term,
    fetcher: (search, signal) => getArticles({ ...params, search: search || undefined }, signal),
    enabled: !!params.tenantSlug,
  });
}

export function useArticle(tenantSlug: string, slug: string) {
  return useQuery({
    queryKey: ["kb", "article", tenantSlug, slug],
    queryFn: () => getArticleBySlug(tenantSlug, slug),
    enabled: !!slug,
  });
}

// Staff and admin (auth required), used by the admin KB pages, which must see
// every status (not just published) via the server-enforced /kb/admin path.
export function useAdminArticleSearch(params: Omit<KBListParams, "search">, term: string) {
  return useSearchQuery({
    queryKey: ["kb", "admin-articles", params],
    term,
    fetcher: (search, signal) => getAdminArticles({ ...params, search: search || undefined }, signal),
    enabled: !!params.tenantSlug,
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

/** Votes by article id; the article page is cached by slug, so the slug is passed for the refresh. */
export function useVoteArticle(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, helpful }: { id: string; slug: string; helpful: boolean }) =>
      voteArticle(tenantSlug, id, helpful),
    onSuccess: (_, { slug }) =>
      qc.invalidateQueries({ queryKey: ["kb", "article", tenantSlug, slug] }),
  });
}
