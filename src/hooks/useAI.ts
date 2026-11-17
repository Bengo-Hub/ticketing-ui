"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAiSettings, updateAiSettings } from "@/lib/api/ai";
import type { AiSettings } from "@/types/ai";

/** How an AI request failed, as the UI tells it (docs/ai.md, Errors). */
export type AiFailure = "credits" | "unavailable" | "notResolved" | "other";

/** Maps an AI route error to what the UI shows: 402 out of credits, 503 unavailable, 409 not resolved. */
export function aiFailure(error: unknown): AiFailure | null {
  if (!error) return null;
  const response = (error as { response?: { status?: number; data?: { code?: string } } }).response;
  const status = response?.status;
  const code = response?.data?.code;
  if (status === 402 || code === "ai_credits_exhausted") return "credits";
  if (status === 503 || code === "ai_unavailable" || code === "ai_credits_unknown") return "unavailable";
  if (status === 409 || code === "ticket_not_resolved") return "notResolved";
  return "other";
}

/** A request key of 8 to 100 characters from A-Z a-z 0-9 . _ : - (docs/ai.md). */
function newRequestKey(): string {
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  return `tkt-ui:${id}`;
}

/**
 * One AI button. `start` is a new click and gets a new Idempotency-Key; `retry` repeats the last
 * click with the same key, so an answer the API already paid for comes back without a second
 * charge. Each button has its own state, so a failure never blocks anything else on the page.
 */
export function useAiAction<T>(call: (key: string) => Promise<T>, onSuccess?: (data: T) => void) {
  const mutation = useMutation({
    mutationFn: ({ key }: { key: string }) => call(key),
    onSuccess: (data) => onSuccess?.(data),
  });
  const { mutate, variables } = mutation;
  return {
    data: mutation.data,
    error: mutation.error,
    isPending: mutation.isPending,
    failure: aiFailure(mutation.error),
    start: () => mutate({ key: newRequestKey() }),
    retry: () => mutate(variables ?? { key: newRequestKey() }),
    reset: mutation.reset,
  };
}

const aiSettingsKey = (tenantSlug: string) => ["ai-settings", tenantSlug] as const;

/** The tenant's AI settings. Only settings managers fetch it. */
export function useAiSettings(tenantSlug: string, enabled = true) {
  return useQuery({
    queryKey: aiSettingsKey(tenantSlug),
    queryFn: () => getAiSettings(tenantSlug),
    enabled: enabled && !!tenantSlug,
    staleTime: 60_000,
  });
}

/** Saves the AI settings and keeps the API's answer as the cached copy. */
export function useUpdateAiSettings(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AiSettings) => updateAiSettings(tenantSlug, data),
    onSuccess: (saved) => qc.setQueryData(aiSettingsKey(tenantSlug), saved),
  });
}
