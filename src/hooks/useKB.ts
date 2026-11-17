"use client";

import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createArticle,
  deleteArticle,
  getAdminArticle,
  getAdminArticles,
  updateArticle,
} from "@/lib/api/kb";
import {
  getPublicArticle,
  getPublicCategories,
  listPublicArticles,
  votePublicArticle,
} from "@/lib/api/public-kb";
import type { CursorPage } from "@/types/tickets";
import type { CreateArticleData, KBListParams, PublicKBArticle, UpdateArticleData } from "@/types/kb";

const nextCursor = <T,>(last: CursorPage<T>) => (last.has_more && last.next_cursor ? last.next_cursor : undefined);

// ─── Public knowledge base (no sign-in, published public articles only) ─────────────────────

/**
 * The public article list a keyset page at a time. The debounced term is part of the key, so a
 * new term starts from the first page, aborting the older request; pages after the first load on
 * "Load more".
 */
export function usePublicArticleList(tenantSlug: string, category: string, term: string, limit = 20) {
  return useInfiniteQuery({
    queryKey: ["kb", "public-articles", tenantSlug, category, term, limit],
    queryFn: ({ pageParam, signal }) =>
      listPublicArticles(
        tenantSlug,
        { search: term || undefined, category: category || undefined, cursor: pageParam || undefined, limit },
        signal,
      ),
    initialPageParam: "",
    getNextPageParam: nextCursor,
    placeholderData: keepPreviousData,
    enabled: !!tenantSlug,
    staleTime: 60_000,
  });
}

/** A public article. `initial` is the copy the server already fetched, so the view counts once. */
export function usePublicArticle(tenantSlug: string, slug: string, initial?: PublicKBArticle | null) {
  return useQuery({
    queryKey: ["kb", "public-article", tenantSlug, slug],
    queryFn: ({ signal }) => getPublicArticle(tenantSlug, slug, signal),
    enabled: !!tenantSlug && !!slug,
    initialData: initial ?? undefined,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function usePublicCategories(tenantSlug: string) {
  return useQuery({
    queryKey: ["kb", "public-categories", tenantSlug],
    queryFn: ({ signal }) => getPublicCategories(tenantSlug, signal),
    enabled: !!tenantSlug,
    staleTime: 5 * 60_000,
  });
}

/** Votes by article id. The counts on screen are bumped in place, as a refetch would count a view. */
export function useVotePublicArticle(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, helpful }: { id: string; slug: string; helpful: boolean }) =>
      votePublicArticle(tenantSlug, id, helpful),
    onSuccess: (_, { slug, helpful }) =>
      qc.setQueryData<PublicKBArticle>(["kb", "public-article", tenantSlug, slug], (a) =>
        a
          ? {
              ...a,
              helpful_count: a.helpful_count + (helpful ? 1 : 0),
              not_helpful_count: a.not_helpful_count + (helpful ? 0 : 1),
            }
          : a,
      ),
  });
}

// ─── Staff (sign-in, every status) ─────────────────────────────────────────────────────────

/** The staff article list a keyset page at a time, with the same term handling as above. */
export function useAdminArticleList(params: Omit<KBListParams, "search" | "cursor">, term: string) {
  return useInfiniteQuery({
    queryKey: ["kb", "admin-articles", params, term],
    queryFn: ({ pageParam, signal }) =>
      getAdminArticles({ ...params, search: term || undefined, cursor: pageParam || undefined }, signal),
    initialPageParam: "",
    getNextPageParam: nextCursor,
    placeholderData: keepPreviousData,
    enabled: !!params.tenantSlug,
    staleTime: 30_000,
  });
}

export function useAdminArticle(tenantSlug: string, id: string) {
  return useQuery({
    queryKey: ["kb", "admin-article", tenantSlug, id],
    queryFn: () => getAdminArticle(tenantSlug, id),
    enabled: !!id,
  });
}

function invalidateLists(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ["kb", "admin-articles"] });
  void qc.invalidateQueries({ queryKey: ["kb", "public-articles"] });
  void qc.invalidateQueries({ queryKey: ["kb", "public-categories"] });
}

export function useCreateArticle(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateArticleData) => createArticle(tenantSlug, payload),
    onSuccess: () => invalidateLists(qc),
  });
}

export function useUpdateArticle(tenantSlug: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateArticleData) => updateArticle(tenantSlug, id, payload),
    onSuccess: () => {
      invalidateLists(qc);
      void qc.invalidateQueries({ queryKey: ["kb", "public-article", tenantSlug] });
      void qc.invalidateQueries({ queryKey: ["kb", "admin-article", tenantSlug, id] });
    },
  });
}

export function useDeleteArticle(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteArticle(tenantSlug, id),
    onSuccess: () => invalidateLists(qc),
  });
}
