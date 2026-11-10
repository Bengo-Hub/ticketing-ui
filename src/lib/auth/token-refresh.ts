/**
 * Access-token refresh for ticketing-ui, built on the shared cross-tab-safe refresher
 * (@bengo-hub/shared-ui-lib/auth createSessionRefresher). Before spending the refresh token it
 * picks up a newer session another tab saved, tabs take turns refreshing, and an enrolment-only
 * answer counts as signed out. See the shared module for the full story.
 *
 * This app keeps its session in a plain localStorage entry (lib/auth/session.ts), not a zustand
 * persist store, so reading and saving go through that module.
 */

import { createSessionRefresher } from "@bengo-hub/shared-ui-lib/auth";
import { useAuthStore } from "@/store/auth";
import { refreshTokens } from "@/lib/auth/api";
import { AUTH_STORAGE_KEY, loadAuthState, persistAuthState } from "@/lib/auth/session";

export { AUTH_STORAGE_KEY };

/**
 * Loads the session another tab saved into the store. An empty entry is ignored so a storage
 * hiccup never signs this tab out.
 */
export function reloadSessionFromStorage(): void {
  const stored = loadAuthState();
  if (!stored.session) return;
  useAuthStore.setState(stored.user ? { session: stored.session, user: stored.user } : { session: stored.session });
}

const refreshSession = createSessionRefresher({
  lockName: AUTH_STORAGE_KEY,
  getSession: () => useAuthStore.getState().session,
  reloadSession: reloadSessionFromStorage,
  saveSession: (session) => {
    useAuthStore.setState({ session });
    persistAuthState({ session });
  },
  refresh: refreshTokens,
});

/**
 * Returns a usable access token, or null when the session is over (or auth-api could not be
 * reached; callers here treat both the same way). Pass the token the server just rejected
 * when it is known.
 */
export async function refreshAccessToken(failedToken?: string | null): Promise<string | null> {
  const outcome = await refreshSession(failedToken);
  return "token" in outcome ? outcome.token : null;
}
