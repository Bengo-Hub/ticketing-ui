"use client";

import { useAuthStore } from "@/store/auth";

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const session = useAuthStore((s) => s.session);

  const isAuthenticated = status === "authenticated" && !!session;
  const isLoading = status === "loading" || status === "syncing";
  const isPlatformOwner = user?.isPlatformOwner === true;

  return {
    user,
    session,
    status,
    isAuthenticated,
    isLoading,
    isPlatformOwner,
  };
}
