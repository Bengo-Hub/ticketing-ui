"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type PropsWithChildren, type ReactNode } from "react";

import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { watchSessionAcrossTabs } from "@bengo-hub/shared-ui-lib/auth";

import { toast } from "sonner";
import { Button } from "@/components/ui/base";
import { useMe } from "@/hooks/useMe";
import { useServicePermissions } from "@/hooks/useServicePermissions";
import { useT } from "@/hooks/useT";
import { isSubscription403, setOn401, setOnSubscription403, setPlatformOwner, setTenantContext } from "@/lib/api-client";
import { isSessionRefusal } from "@/lib/auth/api";
import { SUBSCRIPTIONS_UI_URL } from "@/lib/subscriptions";
import { AUTH_STORAGE_KEY, useAuthStore } from "@/store/auth";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false,
      },
    },
  });
}

/** The full-screen status line the guard shows instead of the app. */
function SessionScreen({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div role="status" aria-live="polite" className="flex flex-col items-center gap-4 text-center text-muted-foreground">
        {children}
      </div>
    </div>
  );
}

/**
 * Keeps the app hidden until the session is known, then either shows it or sends the person to
 * SSO sign-in exactly once (treasury-ui's flow):
 *
 * - Until initialize() has restored the saved session it renders one neutral loader. `initialized`
 *   is false on the server and on the first client render alike, so hydration matches whatever
 *   the browser has stored.
 * - A refused refresh or a refused /me clears the session; with no session the guard redirects to
 *   sign-in once and shows "Redirecting to sign-in" meanwhile. Nothing waits on a request that
 *   failed, so a rejected session can never leave the loader spinning.
 */
function AuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { t } = useT();
  const initialized = useAuthStore((s) => s.initialized);
  const session = useAuthStore((s) => s.session);
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const endSession = useAuthStore((s) => s.endSession);
  const redirectToSSO = useAuthStore((s) => s.redirectToSSO);
  const me = useMe(status === "authenticated");

  const isAuthPage = pathname.includes("/auth/");
  const isUnauthorizedPage = pathname.endsWith("/unauthorized");
  const orgSlug = pathname.split("/")[1] ?? "";
  // Service profile (ticketing role and permissions). A permission 403 here means the person has
  // no access to this tenant's desk; a subscription 403 never redirects (shared-docs gating guide).
  const service = useServicePermissions(orgSlug);

  // auth-api refused the session on /me (useMe already tried one refresh): drop it here, and the
  // redirect below takes the person to sign in. Clearing stops every further /me call.
  useEffect(() => {
    if (me.isError && isSessionRefusal(me.error)) endSession();
  }, [me.isError, me.error, endSession]);

  // No session once the saved one is restored: sign in, once per page load (redirectToSSO
  // ignores repeat calls).
  useEffect(() => {
    if (!initialized || isAuthPage || session || !orgSlug || status === "error") return;
    void redirectToSSO(orgSlug, window.location.href);
  }, [initialized, isAuthPage, session, orgSlug, status, redirectToSSO]);

  useEffect(() => {
    if (!session || isUnauthorizedPage || !service.isError) return;
    const res = (service.error as { response?: { status?: number; data?: unknown } })?.response;
    if (res?.status === 403 && !isSubscription403(res.data)) {
      router.replace(orgSlug ? `/${orgSlug}/unauthorized` : "/unauthorized");
    }
  }, [session, service.isError, service.error, isUnauthorizedPage, orgSlug, router]);

  // The sign-in callback renders its own progress and errors.
  if (isAuthPage) return <>{children}</>;

  if (!initialized) {
    return (
      <SessionScreen>
        <p className="animate-pulse">{t("auth.initializing")}</p>
      </SessionScreen>
    );
  }

  if (!session) {
    if (status === "error") {
      return (
        <SessionScreen>
          <p>{t("auth.startFailed")}</p>
          <Button onClick={() => void redirectToSSO(orgSlug, window.location.href)}>{t("auth.signInAgain")}</Button>
        </SessionScreen>
      );
    }
    return (
      <SessionScreen>
        <p className="animate-pulse">{t("auth.redirecting")}</p>
      </SessionScreen>
    );
  }

  // Only a session without any known profile waits for /me; a saved profile shows the app at once.
  if (status === "loading" || (status === "authenticated" && !user && me.isLoading)) {
    return (
      <SessionScreen>
        <p className="animate-pulse">{t("auth.initializing")}</p>
      </SessionScreen>
    );
  }

  return <>{children}</>;
}

/** Registers the API client's 401 and subscription handlers and keeps tabs in step. */
function SessionWiring() {
  const queryClient = useQueryClient();
  const initialize = useAuthStore((s) => s.initialize);
  const logout = useAuthStore((s) => s.logout);
  const { t } = useT();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  // Another tab renewed or replaced the session: load it here and re-point the API client, so
  // this tab neither sends a rotated-away token nor writes its stale copy back.
  useEffect(
    () =>
      watchSessionAcrossTabs(AUTH_STORAGE_KEY, () => {
        void Promise.resolve(useAuthStore.persist.rehydrate()).then(() => {
          const user = useAuthStore.getState().user;
          setTenantContext(user?.tenantId ?? null, user?.tenantSlug ?? null);
          setPlatformOwner(!!user?.isPlatformOwner);
        });
      }),
    [],
  );

  // Fires only after the API client's own refresh was refused. Skipped while signing in and in
  // the first 15 seconds after it, when a new token may still be propagating.
  useEffect(() => {
    setOn401(() => {
      const { status, lastAuthenticatedAt } = useAuthStore.getState();
      if (status === "syncing" || status === "loading") return;
      if (lastAuthenticatedAt && Date.now() - lastAuthenticatedAt < 15_000) return;
      queryClient.clear();
      void logout();
    });
    return () => setOn401(null);
  }, [queryClient, logout]);

  useEffect(() => {
    setOnSubscription403((data) => {
      toast.error(data.error || t("auth.subscriptionInactive"), {
        id: "subscription-403",
        action: { label: t("auth.viewPlans"), onClick: () => window.open(SUBSCRIPTIONS_UI_URL, "_blank", "noopener") },
      });
    });
    return () => setOnSubscription403(null);
  }, [t]);

  return null;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => makeQueryClient());
  const showDevtools = process.env.NODE_ENV !== "production";

  return (
    <QueryClientProvider client={queryClient}>
      <SessionWiring />
      <AuthGuard>{children}</AuthGuard>
      {showDevtools ? <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" /> : null}
    </QueryClientProvider>
  );
}
