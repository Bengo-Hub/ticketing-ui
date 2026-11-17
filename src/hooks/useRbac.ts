"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as rbac from "@/lib/api/rbac";

const KEYS = {
  team: (t: string) => ["rbac-team", t] as const,
  roles: (t: string) => ["rbac-roles", t] as const,
  permissions: (t: string) => ["rbac-permissions", t] as const,
  rolePermissions: (t: string, id: string) => ["rbac-role-permissions", t, id] as const,
  changes: (t: string) => ["rbac-role-changes", t] as const,
};

export function useTeam(tenant: string) {
  return useQuery({ queryKey: KEYS.team(tenant), queryFn: () => rbac.listTeam(tenant), enabled: !!tenant });
}

export function useRoles(tenant: string) {
  return useQuery({ queryKey: KEYS.roles(tenant), queryFn: () => rbac.listRoles(tenant), enabled: !!tenant });
}

export function usePermissionCatalogue(tenant: string) {
  return useQuery({
    queryKey: KEYS.permissions(tenant),
    queryFn: () => rbac.listPermissions(tenant),
    enabled: !!tenant,
    staleTime: 10 * 60_000,
  });
}

export function useRolePermissionCodes(tenant: string, roleId: string | null) {
  return useQuery({
    queryKey: KEYS.rolePermissions(tenant, roleId ?? ""),
    queryFn: () => rbac.getRolePermissions(tenant, roleId as string),
    enabled: !!tenant && !!roleId,
  });
}

export function useRoleChanges(tenant: string) {
  return useQuery({ queryKey: KEYS.changes(tenant), queryFn: () => rbac.listRoleChanges(tenant), enabled: !!tenant });
}

/**
 * Every change here can move people, counts and the history, so all of it is read again. The
 * signed-in person's own ticketing permissions are read again too, in case they changed their own.
 */
export function useRbacMutation<TArgs, TResult>(tenant: string, run: (args: TArgs) => Promise<TResult>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: () => {
      for (const key of [
        KEYS.team(tenant),
        KEYS.roles(tenant),
        KEYS.changes(tenant),
        ["rbac-role-permissions", tenant],
        ["ticketing", "auth-me", tenant],
      ]) {
        void client.invalidateQueries({ queryKey: key });
      }
    },
  });
}
