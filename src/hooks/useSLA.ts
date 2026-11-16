"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSLAPolicy, deleteSLAPolicy, getSLAPolicies, updateSLAPolicy } from "@/lib/api/sla";
import type { CreateSLAPolicyData, SLAPolicyListParams, UpdateSLAPolicyData } from "@/types/sla";

export function useSLAPolicies(params: SLAPolicyListParams) {
  return useQuery({
    queryKey: ["sla-policies", params],
    queryFn: () => getSLAPolicies(params),
    enabled: !!params.tenantSlug,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

export function useCreateSLAPolicy(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSLAPolicyData) => createSLAPolicy(tenantSlug, data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["sla-policies"] }),
  });
}

export function useUpdateSLAPolicy(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSLAPolicyData }) => updateSLAPolicy(tenantSlug, id, data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["sla-policies"] }),
  });
}

export function useDeleteSLAPolicy(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSLAPolicy(tenantSlug, id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["sla-policies"] }),
  });
}
