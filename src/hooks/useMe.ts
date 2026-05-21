"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface MeResponse {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  tenantId?: string;
  tenantSlug?: string;
  role?: string;
  roles?: string[];
  permissions: string[];
  [key: string]: unknown;
}

const ME_QUERY_KEY = ["auth", "me"] as const;
const ME_STALE_MS = 5 * 60 * 1000;

async function fetchMe(): Promise<MeResponse> {
  const { data } = await api.get<MeResponse>("api/v1/auth/me");
  return {
    ...data,
    roles: Array.isArray(data.roles) ? data.roles : data.role ? [data.role] : [],
    permissions: Array.isArray(data.permissions) ? data.permissions : [],
  };
}

export function useMe(enabled = true) {
  const query = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: fetchMe,
    enabled,
    staleTime: ME_STALE_MS,
    gcTime: ME_STALE_MS * 2,
    retry: (failureCount, error: unknown) => {
      const e = error as { response?: { status?: number } };
      if (e?.response?.status === 401 || e?.response?.status === 403) return false;
      return failureCount < 2;
    },
  });

  const user = query.data ?? null;
  const roles = (user?.roles ?? (user?.role ? [user.role] : [])) as string[];
  const permissions = (user?.permissions ?? []) as string[];

  const hasRole = (role: string) => {
    if (!roles.length) return false;
    return roles.includes(role) || roles.includes("super_admin") || roles.includes("admin");
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (roles.includes("super_admin") || roles.includes("admin")) return true;
    return permissions.includes(permission);
  };

  return {
    ...query,
    user,
    hasRole,
    hasPermission,
    isAuthenticated: !!user,
  };
}
