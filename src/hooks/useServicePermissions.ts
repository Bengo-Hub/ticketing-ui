"use client";

import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useMe } from "@/hooks/useMe";
import {
  inferServiceRole,
  isStaffRole,
  permissionsForRole,
  type Permission,
  type ServiceRole,
} from "@/lib/rbac/permissions";

/** Response of ticketing-api `GET /api/v1/{tenant}/ticketing/auth/me`. */
export interface ServiceProfile {
  user_id: string;
  email: string;
  name: string;
  tenant_id: string;
  tenant_slug: string;
  global_roles: string[];
  service_role: ServiceRole;
  permissions: string[];
  agent_id: string | null;
  is_platform_owner: boolean;
}

async function fetchServiceProfile(slug: string): Promise<ServiceProfile> {
  const { data } = await api.get<ServiceProfile>(`api/v1/${slug}/ticketing/auth/me`);
  return data;
}

/**
 * Second step of the SSO profile: the ticketing role and permissions from the service's own RBAC.
 * While the service has not provisioned the user yet (404), the role is inferred from the global
 * SSO roles, as the SSO integration guide prescribes.
 */
export function useServicePermissions(slug: string) {
  const { user } = useMe();
  const query = useQuery({
    queryKey: ["ticketing", "auth-me", slug],
    queryFn: () => fetchServiceProfile(slug),
    enabled: !!slug && !!user,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403 || status === 404) return false;
      return failureCount < 2;
    },
  });

  const profile = query.data ?? null;
  const bypass = !!(profile?.is_platform_owner || user?.isPlatformOwner || user?.isSuperUser);

  const role: ServiceRole | null = profile?.service_role ?? (user ? inferServiceRole(user.roles ?? []) : null);
  const permissions = useMemo<string[]>(
    () => profile?.permissions ?? (role ? permissionsForRole(role) : []),
    [profile, role],
  );

  const can = useCallback(
    (...codes: Permission[]) => bypass || codes.some((c) => permissions.includes(c)),
    [bypass, permissions],
  );

  return {
    ...query,
    profile,
    role,
    agentId: profile?.agent_id ?? null,
    isStaff: bypass || isStaffRole(role),
    isPlatformOwner: bypass,
    can,
  };
}
