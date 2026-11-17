"use client";

import { SSOCallbackError } from "@bengo-hub/shared-ui-lib/auth";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useT } from "@/hooks/useT";
import { useAuthStore } from "@/store/auth";

// Module-level guard so the code is exchanged once (Strict Mode mounts twice and a second
// exchange would find the PKCE verifier already used).
let callbackInvoked = false;

// The stored return URL was captured before the SSO hop. If the person switched organisation
// while signing in, its slug is stale, so the first path segment is pointed at the org the token
// was issued for. Other origins are dropped.
function sanitizedReturnTo(raw: string | null, orgSlug: string): string | null {
  if (!raw) return null;
  try {
    const url = raw.startsWith("http") ? new URL(raw) : new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    const segments = url.pathname.split("/");
    if (segments[1] && segments[1] !== orgSlug) segments[1] = orgSlug;
    return segments.join("/") + url.search + url.hash;
  } catch {
    return null;
  }
}

function Spinner({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div role="status" aria-live="polite" className="text-center">
        <div className="mx-auto mb-4 size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <h1 className="text-lg font-medium">{title}</h1>
        {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const orgSlug = params?.orgSlug as string;
  const code = searchParams?.get("code");
  const error = searchParams?.get("error");
  const errorDescription = searchParams?.get("error_description");
  const handleSSOCallback = useAuthStore((s) => s.handleSSOCallback);
  const redirectToSSO = useAuthStore((s) => s.redirectToSSO);
  const status = useAuthStore((s) => s.status);
  const authError = useAuthStore((s) => s.error);
  const { t } = useT();

  useEffect(() => {
    if (!code || !orgSlug || callbackInvoked) return;
    callbackInvoked = true;
    void handleSSOCallback(code, `${window.location.origin}/${orgSlug}/auth/callback`);
  }, [code, orgSlug, handleSSOCallback]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const returnTo = sanitizedReturnTo(sessionStorage.getItem("sso_return_to"), orgSlug);
    sessionStorage.removeItem("sso_return_to");
    router.replace(returnTo || `/${orgSlug}/tickets`);
  }, [status, orgSlug, router]);

  // No code and no error means the page was opened directly or reloaded after use: nothing will
  // ever complete, so offer to sign in again instead of spinning.
  if (error || !code || (status === "error" && authError)) {
    // Shared error card: wrong-organisation copy for access_denied and membership errors, generic
    // otherwise. "Sign in again" restarts SSO with a fresh PKCE pair.
    return (
      <SSOCallbackError
        error={error}
        errorDescription={errorDescription ?? authError}
        orgSlug={orgSlug}
        onRetry={() => void redirectToSSO(orgSlug)}
      />
    );
  }

  return <Spinner title={t("auth.completing")} hint={t("auth.syncing")} />;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
