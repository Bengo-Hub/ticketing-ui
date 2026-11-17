"use client";

import { useQuery } from "@tanstack/react-query";
import { errorStatus } from "@bengo-hub/shared-ui-lib/auth";
import { fetchProfile, isSessionRefusal } from "@/lib/auth/api";
import type { UserProfile } from "@/lib/auth/types";
import { useAuthStore } from "@/store/auth";

export const ME_QUERY_KEY = ["auth", "me"] as const;
const ME_STALE_MS = 5 * 60 * 1000;

/**
 * The SSO profile, read with the latest token. A token that expired while the page was open is
 * renewed once and the read repeated, so only a session auth-api really refused comes back as a
 * 401. An outage during the renewal comes back as an ordinary error and never signs anyone out.
 */
async function fetchMe(): Promise<UserProfile> {
  const token = useAuthStore.getState().session?.accessToken;
  if (!token) throw Object.assign(new Error("No session"), { status: 401 });
  try {
    return await fetchProfile(token);
  } catch (error) {
    if (errorStatus(error) !== 401) throw error;
    const { renewSession } = await import("@/lib/auth/token-refresh");
    const outcome = await renewSession(token);
    if ("token" in outcome) return fetchProfile(outcome.token);
    if ("rejected" in outcome) throw error;
    throw new Error("auth-api unreachable");
  }
}

/**
 * SSO identity from auth-api `GET /api/v1/auth/me` (SSO integration guide, useMe hook pattern).
 * Never the ticketing backend: service roles and permissions come from useServicePermissions.
 *
 * A failed read is not fetched again just because another component mounts (retryOnMount off):
 * the guard hides the page while this loads, and a remount refetch of a failing read would loop.
 */
export function useMe(enabled = true) {
  const signedIn = useAuthStore((s) => !!s.session?.accessToken);
  const query = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: fetchMe,
    enabled: enabled && signedIn,
    staleTime: ME_STALE_MS,
    gcTime: ME_STALE_MS * 2,
    retryOnMount: false,
    retry: (failureCount, error: unknown) => !isSessionRefusal(error) && failureCount < 2,
  });
  return { ...query, user: query.data ?? null, isAuthenticated: !!query.data };
}
