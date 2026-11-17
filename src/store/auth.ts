import { expiryMs } from "@bengo-hub/shared-ui-lib/auth";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { attachAuthTokenGetter, setPlatformOwner, setTenantContext } from "@/lib/api-client";
import {
  buildAuthorizeUrl,
  buildLogoutUrl,
  exchangeCodeForTokens,
  fetchProfile,
  isSessionRefusal,
  revokeServerSession,
} from "@/lib/auth/api";
import {
  consumeState,
  consumeVerifier,
  generateCodeChallenge,
  generateCodeVerifier,
  generateState,
  storeState,
  storeVerifier,
} from "@/lib/auth/pkce";
import type { Session, UserProfile } from "@/lib/auth/types";

/** The persisted store key; also names the cross-tab refresh lock and the storage watcher. */
export const AUTH_STORAGE_KEY = "ticketing-auth-storage";

/** Keys earlier builds kept in localStorage. Removed on sign-out so no old token lingers. */
const RETIRED_STORAGE_KEYS = ["ticketing_auth", "tenantId", "tenantSlug", "is_platform_owner"];

/** A token this close to expiry is renewed before use. */
const EXPIRY_MARGIN_MS = 60_000;

type AuthStatus = "idle" | "loading" | "authenticated" | "syncing" | "error";

interface AuthState {
  status: AuthStatus;
  user: UserProfile | null;
  session: Session | null;
  error: string | null;
  lastAuthenticatedAt: number | null;
  /**
   * initialize() has finished restoring the saved session. Never persisted, so it is false on the
   * server and on the first client render alike: the guard renders one neutral loader until then,
   * which keeps hydration identical whatever the browser has stored.
   */
  initialized: boolean;

  initialize: () => Promise<void>;
  redirectToSSO: (orgSlug: string, returnTo?: string) => Promise<void>;
  handleSSOCallback: (code: string, callbackUrl: string) => Promise<void>;
  /** Drops the local session after auth-api refused it; the guard then sends the person to sign in once. */
  endSession: () => void;
  logout: () => Promise<void>;
}

function applyTenant(user: UserProfile | null) {
  setTenantContext(user?.tenantId ?? null, user?.tenantSlug ?? null);
  setPlatformOwner(!!user?.isPlatformOwner);
}

// One restore per page load, shared by every caller (Strict Mode runs effects twice).
let initializing: Promise<void> | null = null;
// One automatic SSO redirect per page load: a second one would overwrite the PKCE verifier the
// first one is waiting on.
let ssoRedirectStarted = false;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      const signedOut = {
        status: "idle" as const,
        user: null,
        session: null,
        lastAuthenticatedAt: null,
      };

      const endSession = () => {
        applyTenant(null);
        set({ ...signedOut, error: null });
      };

      const authenticated = (user: UserProfile) => {
        applyTenant(user);
        set({ user, status: "authenticated", error: null, lastAuthenticatedAt: Date.now() });
      };

      const restore = async () => {
        // The SSO callback is signing in on this page already; leave its state alone.
        if (get().status === "syncing") return;
        const { session, user } = get();
        if (!session) {
          set({ status: "idle", user: null });
          return;
        }

        const expiring = Date.now() >= expiryMs(session.expiresAt) - EXPIRY_MARGIN_MS;
        if (user && !expiring) {
          authenticated(user);
          return;
        }

        set({ status: "loading", error: null });
        let token = session.accessToken;

        // The access token expired: renew it silently instead of a sign-in round trip. A known
        // profile is kept, so a reload after expiry costs one small refresh call.
        // Dynamic import: token-refresh imports this store.
        if (expiring) {
          const { renewSession } = await import("@/lib/auth/token-refresh");
          const outcome = session.refreshToken ? await renewSession(session.accessToken) : { rejected: true as const };
          if ("rejected" in outcome) {
            endSession();
            return;
          }
          if ("token" in outcome) {
            token = outcome.token;
            if (user) {
              authenticated(user);
              return;
            }
          }
        }

        try {
          authenticated(await fetchProfile(token));
        } catch (error) {
          // auth-api refused the token, or there is no profile to fall back on: sign in again.
          if (isSessionRefusal(error) || !user) {
            endSession();
            return;
          }
          // auth-api could not be reached: keep working with the saved profile. A request the
          // server refuses still ends the session through the 401 handler.
          authenticated(user);
        }
      };

      return {
        status: "idle",
        user: null,
        session: null,
        error: null,
        lastAuthenticatedAt: null,
        initialized: false,

        initialize: () => {
          initializing ??= restore()
            .catch(() => endSession())
            .finally(() => set({ initialized: true }));
          return initializing;
        },

        redirectToSSO: async (orgSlug: string, returnTo?: string) => {
          if (ssoRedirectStarted || typeof window === "undefined") return;
          ssoRedirectStarted = true;
          try {
            const verifier = generateCodeVerifier();
            const challenge = await generateCodeChallenge(verifier);
            const state = generateState();
            storeVerifier(verifier);
            storeState(state);
            if (returnTo) sessionStorage.setItem("sso_return_to", returnTo);
            window.location.href = buildAuthorizeUrl({
              codeChallenge: challenge,
              state,
              redirectUri: `${window.location.origin}/${orgSlug}/auth/callback`,
              tenant: orgSlug,
            });
          } catch {
            ssoRedirectStarted = false;
            set({ status: "error", error: "start_failed" });
          }
        },

        handleSSOCallback: async (code: string, callbackUrl: string) => {
          set({ status: "syncing", error: null });
          const verifier = consumeVerifier();
          consumeState();
          if (!verifier) {
            set({ status: "error", error: "Session expired" });
            return;
          }

          try {
            const tokens = await exchangeCodeForTokens({ code, codeVerifier: verifier, redirectUri: callbackUrl });
            const session: Session = {
              accessToken: tokens.access_token,
              refreshToken: tokens.refresh_token || "",
              expiresAt: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
            };
            set({ session });

            // A first sign-in may reach /me before auth-api has finished provisioning the user.
            for (let attempt = 0; attempt < 5; attempt++) {
              try {
                authenticated(await fetchProfile(session.accessToken));
                return;
              } catch {
                await new Promise((r) => setTimeout(r, 1500));
              }
            }
            set({ status: "authenticated", lastAuthenticatedAt: Date.now() });
          } catch (error) {
            set({ status: "error", error: error instanceof Error ? error.message : "Sign-in failed" });
          }
        },

        endSession,

        logout: async () => {
          // The working org, captured before any state is cleared, so signing in again lands on
          // the same organisation: the URL path first, then the signed-in profile.
          let slug = "";
          if (typeof window !== "undefined") {
            const first = window.location.pathname.split("/").filter(Boolean)[0] ?? "";
            if (first && first !== "auth" && first !== "support") slug = first;
          }
          slug = slug || get().user?.tenantSlug || "";

          // Revoke the backend session while the access token is still known.
          await revokeServerSession(get().session?.accessToken);
          endSession();

          if (typeof window !== "undefined") {
            for (const key of [AUTH_STORAGE_KEY, ...RETIRED_STORAGE_KEYS]) {
              try {
                localStorage.removeItem(key);
              } catch {
                // Blocked storage: nothing to clear.
              }
            }
            try {
              sessionStorage.clear();
            } catch {
              // Blocked storage: nothing to clear.
            }
            // Landing on the tenant root signed out starts SSO with tenant=<slug>, so the sign-in
            // screen shows the right organisation.
            window.location.href = slug
              ? buildLogoutUrl(`${window.location.origin}/${slug}`)
              : buildLogoutUrl(
                  `https://accounts.codevertexafrica.com/login?return_to=${encodeURIComponent(window.location.origin)}`,
                );
          }
        },
      };
    },
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ session: state.session, user: state.user }),
    },
  ),
);

attachAuthTokenGetter(() => useAuthStore.getState().session?.accessToken ?? null);
