/**
 * Access-token refresh for ticketing-ui, built on the shared cross-tab-safe refresher
 * (@bengo-hub/shared-ui-lib/auth createSessionRefresher). Before spending the refresh token it
 * picks up a newer session another tab saved, tabs take turns refreshing, and an enrolment-only
 * answer counts as signed out. See the shared module for the full story.
 */

import { createSessionRefresher, type RefreshOutcome } from "@bengo-hub/shared-ui-lib/auth";
import { AUTH_STORAGE_KEY, useAuthStore } from "@/store/auth";
import { refreshTokens } from "@/lib/auth/api";

export { AUTH_STORAGE_KEY };

const refreshSession = createSessionRefresher({
  lockName: AUTH_STORAGE_KEY,
  getSession: () => useAuthStore.getState().session,
  reloadSession: () => useAuthStore.persist.rehydrate(),
  saveSession: (session) => useAuthStore.setState({ session }),
  refresh: refreshTokens,
});

/**
 * The full outcome: a new token, `rejected` (auth-api refused the session, so sign in again) or
 * `transient` (auth-api could not be reached; keep the session). Pass the token the server just
 * rejected when it is known.
 */
export function renewSession(failedToken?: string | null): Promise<RefreshOutcome> {
  return refreshSession(failedToken);
}

/** A usable access token, or null when the session is over or auth-api could not be reached. */
export async function refreshAccessToken(failedToken?: string | null): Promise<string | null> {
  const outcome = await refreshSession(failedToken);
  return "token" in outcome ? outcome.token : null;
}
