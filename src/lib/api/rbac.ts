/**
 * People and roles of a tenant (ticketing-api role management), the same contract as treasury-api's
 * under `/api/v1/{tenant}/ticketing`. A role's permissions can be edited per tenant: editing a
 * default role makes this tenant's own copy, so the answer to a save may be a role with a new id.
 */

import { api } from "@/lib/api-client";

export interface Role {
  id: string;
  tenant_id: string | null;
  scope: "global" | "tenant";
  role_code: string;
  name: string;
  description: string | null;
  is_system_role: boolean;
  is_customized?: boolean;
  member_count?: number;
  permission_count?: number;
}

export interface Permission {
  id: string;
  permission_code: string;
  name: string;
  module: string;
  action: string;
}

export interface HeldRole {
  assignment_id: string;
  role_id: string;
  role_code: string;
  name: string;
  assigned_at: string;
  expires_at: string | null;
  expired: boolean;
}

export interface TeamMember {
  id: string;
  auth_service_user_id: string;
  email: string;
  status: string;
  roles: HeldRole[];
}

export interface RoleChange {
  id: string;
  user_email: string;
  action: string;
  resource_type: string;
  changes?: string;
  created_at: string;
}

export interface RoleInput {
  name: string;
  role_code?: string;
  description?: string;
  permission_codes?: string[];
}

/** The shared Go pagination envelope. */
interface PageEnvelope<T> {
  data?: T[];
  total?: number;
  hasMore?: boolean;
}

const PAGE_SIZE = 100;
const MAX_PAGES = 200;

const base = (tenant: string) => `api/v1/${tenant}/ticketing`;

/** Every member, page by page (the API caps a page at 100). */
export async function listTeam(tenant: string): Promise<TeamMember[]> {
  const all: TeamMember[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data } = await api.get<PageEnvelope<TeamMember>>(`${base(tenant)}/users`, {
      params: { limit: PAGE_SIZE, page },
    });
    const rows = data.data ?? [];
    all.push(...rows);
    const more = data.hasMore ?? all.length < (data.total ?? 0);
    if (rows.length < PAGE_SIZE || !more) break;
  }
  return all;
}

export const inviteMember = async (tenant: string, email: string) =>
  (await api.post<{ user_id: string; email: string }>(`${base(tenant)}/users`, { email })).data;

export const assignRole = async (tenant: string, userId: string, roleId: string, expiresAt: string | null) =>
  (await api.post<Role>(`${base(tenant)}/users/${userId}/roles`, { role_id: roleId, expires_at: expiresAt })).data;

export const revokeRole = async (tenant: string, userId: string, roleId: string) => {
  await api.delete(`${base(tenant)}/users/${userId}/roles/${roleId}`);
};

export const listRoles = async (tenant: string) =>
  (await api.get<{ roles?: Role[] }>(`${base(tenant)}/roles`)).data.roles ?? [];

export const listPermissions = async (tenant: string) =>
  (await api.get<{ permissions?: Permission[] }>(`${base(tenant)}/permissions`)).data.permissions ?? [];

export const getRolePermissions = async (tenant: string, roleId: string) =>
  (await api.get<{ permission_codes?: string[] }>(`${base(tenant)}/roles/${roleId}/permissions`)).data
    .permission_codes ?? [];

export const setRolePermissions = async (tenant: string, roleId: string, codes: string[]) =>
  (await api.put<Role>(`${base(tenant)}/roles/${roleId}/permissions`, { permission_codes: codes })).data;

export const createRole = async (tenant: string, input: RoleInput) =>
  (await api.post<Role>(`${base(tenant)}/roles`, input)).data;

/** The tenant's own editable copy of a default role; asking again returns the same copy. */
export const customizeRole = async (tenant: string, roleCode: string) =>
  (await api.post<Role>(`${base(tenant)}/roles/customize`, { role_code: roleCode })).data;

export const cloneRole = async (tenant: string, roleId: string, input: RoleInput) =>
  (await api.post<Role>(`${base(tenant)}/roles/${roleId}/clone`, input)).data;

export const updateRole = async (tenant: string, roleId: string, input: Pick<RoleInput, "name" | "description">) =>
  (await api.patch<Role>(`${base(tenant)}/roles/${roleId}`, input)).data;

export const deleteRole = async (tenant: string, roleId: string) => {
  await api.delete(`${base(tenant)}/roles/${roleId}`);
};

export const listRoleChanges = async (tenant: string) =>
  (await api.get<PageEnvelope<RoleChange>>(`${base(tenant)}/rbac/audit-logs`, { params: { limit: 100 } })).data
    .data ?? [];

/** The API's own reason when it gave one (409 and 422 answers explain themselves). */
export function apiErrorText(error: unknown, fallback: string): string {
  const reason = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
  return reason ?? fallback;
}
