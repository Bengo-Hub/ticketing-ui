import {
  BarChart3,
  BookOpen,
  ClipboardList,
  HeadphonesIcon,
  LayoutDashboard,
  PlusCircle,
  Settings,
  Shield,
  Users,
  type LucideIcon,
} from "lucide-react";
import { PERM, type Permission } from "@/lib/rbac/permissions";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** Shown when the person holds any of these ticketing permissions. */
  anyOf: Permission[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

/** One navigation definition for the sidebar and the mobile bottom bar. */
export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Tickets",
    items: [
      { id: "tickets", label: "Tickets", href: "/tickets", icon: ClipboardList, anyOf: [PERM.ticketsView, PERM.ticketsViewOwn] },
      { id: "new-ticket", label: "Create Ticket", href: "/tickets/new", icon: PlusCircle, anyOf: [PERM.ticketsAdd] },
      { id: "kb", label: "Knowledge Base", href: "/kb", icon: BookOpen, anyOf: [PERM.kbView] },
    ],
  },
  {
    title: "Agent",
    items: [
      { id: "agent-inbox", label: "My Inbox", href: "/agent", icon: HeadphonesIcon, anyOf: [PERM.ticketsView] },
    ],
  },
  {
    title: "Admin",
    items: [
      { id: "admin", label: "Dashboard", href: "/admin", icon: LayoutDashboard, anyOf: [PERM.analyticsView] },
      { id: "admin-teams", label: "Teams", href: "/admin/teams", icon: Users, anyOf: [PERM.teamsView, PERM.teamsManage] },
      { id: "admin-agents", label: "Agents", href: "/admin/agents", icon: Shield, anyOf: [PERM.agentsView, PERM.agentsManage] },
      { id: "admin-analytics", label: "Analytics", href: "/admin/analytics", icon: BarChart3, anyOf: [PERM.analyticsView] },
      { id: "admin-kb", label: "Knowledge Base", href: "/admin/kb", icon: BookOpen, anyOf: [PERM.kbManage] },
      { id: "admin-settings", label: "Settings", href: "/admin/settings", icon: Settings, anyOf: [PERM.settingsManage] },
    ],
  },
];

/** The sections and items the person may open, empty sections dropped. */
export function visibleNav(can: (...codes: Permission[]) => boolean): NavSection[] {
  return NAV_SECTIONS.map((s) => ({ ...s, items: s.items.filter((i) => can(...i.anyOf)) })).filter(
    (s) => s.items.length > 0,
  );
}

/** The permissions a route needs, matched by the longest nav href prefix. */
export function routePermissions(pathAfterSlug: string): Permission[] | null {
  let best: NavItem | null = null;
  for (const s of NAV_SECTIONS) {
    for (const i of s.items) {
      if (pathAfterSlug === i.href || pathAfterSlug.startsWith(`${i.href}/`)) {
        if (!best || i.href.length > best.href.length) best = i;
      }
    }
  }
  return best ? best.anyOf : null;
}
