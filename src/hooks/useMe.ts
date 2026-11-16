"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchProfile } from "@/lib/auth/api";
import { useAuthStore } from "@/store/auth";

export const ME_QUERY_KEY = ["auth", "me"] as const;
const ME_STALE_MS = 5 * 60 * 1000;

/**
 * SSO identity from auth-api `GET /api/v1/auth/me` (SSO integration guide, useMe hook pattern).
 * Never the ticketing backend: service roles and permissions come from useServicePermissions.
 */
export function useMe(enabled = true) {
  const accessToken = useAuthStore((s) => s.session?.accessToken);
  const query = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: async () => (await fetchProfile(accessToken)).user,
    enabled: enabled && !!accessToken,
    staleTime: ME_STALE_MS,
    gcTime: ME_STALE_MS * 2,
    retry: (failureCount, error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403) return false;
      return failureCount < 2;
    },
  });
  return { ...query, user: query.data ?? null, isAuthenticated: !!query.data };
}
