/**
 * Ticketing service permissions (Layer 3 of the Trinity pattern, shared-docs
 * architecture/trinity-authorization-pattern.md). Codes follow `ticketing.{module}.{action}` and
 * must match ticketing-api's rbac module exactly. The service `/ticketing/auth/me` endpoint is the
 * source of truth; the role table below is used only while that endpoint has not provisioned the
 * user yet (SSO guide: fall back to role inference from global JWT roles).
 */
export const PERM = {
  ticketsView: "ticketing.tickets.view",
  ticketsViewOwn: "ticketing.tickets.view_own",
  ticketsAdd: "ticketing.tickets.add",
  ticketsChange: "ticketing.tickets.change",
  ticketsChangeOwn: "ticketing.tickets.change_own",
  ticketsDelete: "ticketing.tickets.delete",
  ticketsManage: "ticketing.tickets.manage",
  commentsAdd: "ticketing.comments.add",
  agentsView: "ticketing.agents.view",
  agentsManage: "ticketing.agents.manage",
  teamsView: "ticketing.teams.view",
  teamsManage: "ticketing.teams.manage",
  categoriesManage: "ticketing.categories.manage",
  slaView: "ticketing.sla.view",
  slaManage: "ticketing.sla.manage",
  routingView: "ticketing.routing.view",
  routingManage: "ticketing.routing.manage",
  kbView: "ticketing.kb.view",
  kbManage: "ticketing.kb.manage",
  analyticsView: "ticketing.analytics.view",
  settingsManage: "ticketing.settings.manage",
  rbacManage: "ticketing.rbac.manage",
} as const;

export type Permission = (typeof PERM)[keyof typeof PERM];

export type ServiceRole = "ticketing_admin" | "supervisor" | "agent" | "customer";

const ALL = Object.values(PERM) as Permission[];

const ROLE_PERMISSIONS: Record<ServiceRole, Permission[]> = {
  ticketing_admin: ALL,
  supervisor: [
    PERM.ticketsView, PERM.ticketsAdd, PERM.ticketsChange, PERM.ticketsManage, PERM.commentsAdd,
    PERM.agentsView, PERM.teamsView, PERM.slaView, PERM.routingView, PERM.kbView, PERM.kbManage,
    PERM.analyticsView,
  ],
  agent: [PERM.ticketsView, PERM.ticketsAdd, PERM.ticketsChange, PERM.commentsAdd, PERM.kbView],
  customer: [PERM.ticketsAdd, PERM.ticketsViewOwn, PERM.ticketsChangeOwn, PERM.commentsAdd, PERM.kbView],
};

/** Maps global SSO roles to the ticketing role, mirroring ticketing-api's JIT mapping. */
export function inferServiceRole(globalRoles: string[]): ServiceRole {
  const has = (r: string) => globalRoles.includes(r);
  if (has("superuser") || has("admin")) return "ticketing_admin";
  if (has("manager")) return "supervisor";
  const staff = ["staff", "receptionist", "cashier", "waiter", "kitchen", "bar", "rider"];
  if (staff.some(has)) return "agent";
  return "customer";
}

/**
 * Whether a set of granted codes covers `code`, by the same rules as ticketing-api's rbac module:
 * an exact match; `{module}.manage` covers every action in its module; `{module}.manage_own`
 * covers every `*_own` action; and `view`, `change` or `delete` covers its `_own` form.
 */
export function grants(granted: readonly string[], code: string): boolean {
  if (granted.includes(code)) return true;
  const dot = code.lastIndexOf(".");
  const mod = code.slice(0, dot);
  const action = code.slice(dot + 1);
  if (granted.includes(`${mod}.manage`)) return true;
  if (action.endsWith("_own")) {
    if (granted.includes(`${mod}.manage_own`)) return true;
    if (granted.includes(`${mod}.${action.slice(0, -4)}`)) return true;
  }
  return false;
}

export function permissionsForRole(role: ServiceRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/** Staff roles see the agent workspace; customers see only their own tickets. */
export function isStaffRole(role: ServiceRole | null | undefined): boolean {
  return role === "ticketing_admin" || role === "supervisor" || role === "agent";
}
