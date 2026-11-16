"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCategory, deleteCategory, getCategories, updateCategory } from "@/lib/api/tickets";
import type { CreateCategoryData, UpdateCategoryData } from "@/types/tickets";

export function useCategories(tenantSlug: string) {
  return useQuery({
    queryKey: ["categories", tenantSlug],
    queryFn: () => getCategories(tenantSlug),
    enabled: !!tenantSlug,
    staleTime: 10 * 60_000,
  });
}

export function useCreateCategory(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryData) => createCategory(tenantSlug, data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["categories", tenantSlug] }),
  });
}

export function useUpdateCategory(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryData }) => updateCategory(tenantSlug, id, data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["categories", tenantSlug] }),
  });
}

export function useDeleteCategory(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(tenantSlug, id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["categories", tenantSlug] }),
  });
}
