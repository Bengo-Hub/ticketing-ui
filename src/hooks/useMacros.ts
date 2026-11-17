"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { applyMacro, createMacro, deleteMacro, getMacros, updateMacro } from "@/lib/api/workspace";
import type { MacroInput } from "@/types/workspace";
import { analyticsKey } from "@/hooks/useAnalytics";

/** Macros by name. The composer asks for active ones only; the admin page lists all. */
export function useMacros(slug: string, activeOnly = false, enabled = true) {
  return useQuery({
    queryKey: ["macros", slug, activeOnly],
    queryFn: () => getMacros(slug, activeOnly),
    enabled: enabled && !!slug,
    staleTime: 5 * 60_000,
  });
}

export function useSaveMacro(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: MacroInput }) =>
      id ? updateMacro(slug, id, data) : createMacro(slug, data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["macros", slug] }),
  });
}

export function useDeleteMacro(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMacro(slug, id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["macros", slug] }),
  });
}

/** Applies a macro to a ticket: its field changes and its reply, in one step on the API. */
export function useApplyMacro(slug: string, ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (macroId: string) => applyMacro(slug, ticketId, macroId),
    onSuccess: (res) => {
      qc.setQueryData(["ticket", slug, ticketId], res.ticket);
      void qc.invalidateQueries({ queryKey: ["ticket-comments", slug, ticketId] });
      void qc.invalidateQueries({ queryKey: ["tickets"] });
      void qc.invalidateQueries({ queryKey: analyticsKey(slug) });
    },
  });
}
