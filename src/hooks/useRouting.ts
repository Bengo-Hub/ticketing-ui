"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRoutingRule, deleteRoutingRule, getRoutingRules, updateRoutingRule } from "@/lib/api/routing";
import type { CreateRoutingRuleData, UpdateRoutingRuleData } from "@/types/routing";

export function useRoutingRules(tenantSlug: string, page = 1, limit = 25) {
  return useQuery({
    queryKey: ["routing-rules", tenantSlug, page, limit],
    queryFn: () => getRoutingRules(tenantSlug, { page, limit }),
    enabled: !!tenantSlug,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

export function useCreateRoutingRule(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRoutingRuleData) => createRoutingRule(tenantSlug, data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["routing-rules", tenantSlug] }),
  });
}

export function useUpdateRoutingRule(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoutingRuleData }) => updateRoutingRule(tenantSlug, id, data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["routing-rules", tenantSlug] }),
  });
}

export function useDeleteRoutingRule(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRoutingRule(tenantSlug, id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["routing-rules", tenantSlug] }),
  });
}
