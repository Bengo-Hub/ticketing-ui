import {
  BarChart3,
  BookOpen,
  ClipboardList,
  HeadphonesIcon,
  LayoutDashboard,
  PlusCircle,
  Route,
  Settings,
  Shield,
  Tags,
  Timer,
  Users,
  type LucideIcon,
} from "lucide-react";
import { PERM, type Permission } from "@/lib/rbac/permissions";
import type { MessageKey } from "@/lib/i18n";

export interface NavItem {
  id: string;
  /** Message key of the label; screens translate it with useT(). */
  label: MessageKey;
  href: string;
  icon: LucideIcon;
  /** Shown when the person holds any of these ticketing permissions. */
  anyOf: Permission[];
}

export interface NavSection {
  id: "tickets" | "agent" | "admin";
  /** Message key of the section heading. */
  title: MessageKey;
  items: NavItem[];
}

/** One navigation definition for the sidebar and the mobile bottom bar. */
export const NAV_SECTIONS: NavSection[] = [
  {
    id: "tickets",
    title: "nav.sectionTickets",
    items: [
      { id: "tickets", label: "nav.tickets", href: "/tickets", icon: ClipboardList, anyOf: [PERM.ticketsView, PERM.ticketsViewOwn] },
      { id: "new-ticket", label: "nav.newTicket", href: "/tickets/new", icon: PlusCircle, anyOf: [PERM.ticketsAdd] },
      { id: "kb", label: "nav.kb", href: "/kb", icon: BookOpen, anyOf: [PERM.kbView] },
    ],
  },
  {
    id: "agent",
    title: "nav.sectionAgent",
    items: [
      { id: "agent-inbox", label: "nav.agentInbox", href: "/agent", icon: HeadphonesIcon, anyOf: [PERM.ticketsView] },
    ],
  },
  {
    id: "admin",
    title: "nav.sectionAdmin",
    items: [
      { id: "admin", label: "nav.admin", href: "/admin", icon: LayoutDashboard, anyOf: [PERM.analyticsView] },
      { id: "admin-teams", label: "nav.adminTeams", href: "/admin/teams", icon: Users, anyOf: [PERM.teamsView, PERM.teamsManage] },
      { id: "admin-agents", label: "nav.adminAgents", href: "/admin/agents", icon: Shield, anyOf: [PERM.agentsView, PERM.agentsManage] },
      { id: "admin-analytics", label: "nav.adminAnalytics", href: "/admin/analytics", icon: BarChart3, anyOf: [PERM.analyticsView] },
      { id: "admin-kb", label: "nav.adminKb", href: "/admin/kb", icon: BookOpen, anyOf: [PERM.kbManage] },
      { id: "admin-categories", label: "nav.adminCategories", href: "/admin/categories", icon: Tags, anyOf: [PERM.categoriesManage] },
      { id: "admin-sla", label: "nav.adminSla", href: "/admin/sla", icon: Timer, anyOf: [PERM.slaView, PERM.slaManage] },
      { id: "admin-routing", label: "nav.adminRouting", href: "/admin/routing", icon: Route, anyOf: [PERM.routingView, PERM.routingManage] },
      { id: "admin-settings", label: "nav.adminSettings", href: "/admin/settings", icon: Settings, anyOf: [PERM.settingsManage] },
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
