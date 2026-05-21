"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type PropsWithChildren } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { useMe } from "@/hooks/useMe";
import { setOn401 } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth";

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

function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const status = useAuthStore((s) => s.status);
  const redirectToSSO = useAuthStore((s) => s.redirectToSSO);
  const { isError, error, isLoading: meLoading } = useMe(!!session);

  const isAuthCallback = pathname?.includes("/auth/callback");
  const isUnauthorizedPage = pathname?.endsWith("/unauthorized");
  const orgSlug = pathname?.split("/")[1];

  useEffect(() => {
    if (status === "loading" || isAuthCallback) return;
    if (!session && !isAuthCallback) {
      void redirectToSSO(pathname ?? undefined, orgSlug);
    }
  }, [status, session, isAuthCallback, pathname, orgSlug, redirectToSSO]);

  useEffect(() => {
    if (!session || isUnauthorizedPage || meLoading) return;
    const statusCode = (error as { response?: { status?: number } })?.response?.status;
    if (isError && statusCode === 403) {
      const base = pathname?.split("/").slice(0, 2).join("/") || "";
      router.replace(base ? `${base}/unauthorized` : "/unauthorized");
    }
  }, [session, isError, error, isUnauthorizedPage, meLoading, pathname, router]);

  const loading = status === "loading" || (!!session && meLoading);
  if (loading && !isAuthCallback) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Initializing session...</div>
      </div>
    );
  }

  if (!session && !isAuthCallback) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Redirecting to sign-in...</div>
      </div>
    );
  }

  return <>{children}</>;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => makeQueryClient());
  const showDevtools = process.env.NODE_ENV !== "production";
  const initializeAuth = useAuthStore((state) => state.initialize);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);

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

  return (
    <QueryClientProvider client={queryClient}>
      <AuthGuard>{children}</AuthGuard>
      {showDevtools ? <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" /> : null}
    </QueryClientProvider>
  );
}
