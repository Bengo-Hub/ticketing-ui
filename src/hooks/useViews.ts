"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createView, deleteView, getViews, updateView } from "@/lib/api/workspace";
import type { ViewInput } from "@/types/workspace";

/** The caller's saved views and the tenant's shared ones (staff only). */
export function useViews(slug: string, enabled = true) {
  return useQuery({
    queryKey: ["views", slug],
    queryFn: () => getViews(slug),
    enabled: enabled && !!slug,
    staleTime: 5 * 60_000,
  });
}

export function useSaveView(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: ViewInput }) =>
      id ? updateView(slug, id, data) : createView(slug, data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["views", slug] }),
  });
}

export function useDeleteView(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteView(slug, id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["views", slug] }),
  });
}
