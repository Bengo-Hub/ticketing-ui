"use client";

import { useState } from "react";
import { Button } from "@/components/ui/base";
import { cn, orgRoute } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { Bell, ChevronDown, LogIn, Menu, Settings, UserIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useBranding } from "@/providers/branding-provider";
import { useVisibleServices, AppSwitcherGrid, type ServiceKey } from "@bengo-hub/shared-ui-lib/app-switcher";
import { AccountPanel } from "@bengo-hub/shared-ui-lib/account-panel";
import { useServicePermissions } from "@/hooks/useServicePermissions";
import type { ServiceRole } from "@/lib/rbac/permissions";

const ROLE_LABELS: Record<ServiceRole, string> = {
  ticketing_admin: "Admin",
  supervisor: "Supervisor",
  agent: "Agent",
  customer: "Customer",
};

const SERVICE_URLS: Partial<Record<ServiceKey, string>> = {
  pos: process.env.NEXT_PUBLIC_POS_UI_URL ?? "https://pos.codevertexafrica.com",
  inventory: process.env.NEXT_PUBLIC_INVENTORY_UI_URL ?? "https://inventory.codevertexafrica.com",
  treasury: process.env.NEXT_PUBLIC_TREASURY_UI_URL ?? "https://books.codevertexafrica.com",
  marketflow: process.env.NEXT_PUBLIC_MARKETFLOW_UI_URL ?? "https://marketflow.codevertexafrica.com",
  erp: process.env.NEXT_PUBLIC_ERP_UI_URL ?? "https://erp.codevertexafrica.com",
  ordering: process.env.NEXT_PUBLIC_ORDERING_UI_URL ?? "https://ordering.codevertexafrica.com",
  // Account Portal is the auth-ui site; sso.* is the auth API and has no pages.
  auth: process.env.NEXT_PUBLIC_AUTH_UI_URL ?? "https://accounts.codevertexafrica.com",
  subscriptions: process.env.NEXT_PUBLIC_SUBSCRIPTIONS_UI_URL ?? "https://pricing.codevertexafrica.com",
  projects: process.env.NEXT_PUBLIC_PROJECTS_UI_URL ?? "https://projects.codevertexafrica.com",
  afya: process.env.NEXT_PUBLIC_HOSPITAL_UI_URL ?? "https://afya.codevertexafrica.com",
};

function displayName(user: { fullName?: string; firstName?: string; email?: string } | null): string {
  if (!user) return "Account";
  return user.fullName ?? user.firstName ?? user.email?.split("@")[0] ?? "Account";
}

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const params = useParams();
  const orgSlug = (params.orgSlug as string) || "";
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const redirectToSSO = useAuthStore((s) => s.redirectToSSO);
  const { getServiceTitle } = useBranding();
  const [profileOpen, setProfileOpen] = useState(false);
  const name = displayName(user);
  const { role: serviceRole } = useServicePermissions(orgSlug);
  const role = serviceRole ? ROLE_LABELS[serviceRole] : "";
  // The App Store shows every real service to every authenticated user in the tenant — each
  // destination service already enforces its own RBAC + subscription gating on arrival, so
  // pre-filtering the directory here just hid apps that were actually reachable.
  const services = useVisibleServices({ orgSlug, urls: SERVICE_URLS, canManageLinks: true });

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl hover:bg-accent transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5 text-muted-foreground" />
        </button>
        <h1 className="text-lg font-black tracking-tight text-foreground uppercase truncate max-w-[150px] sm:max-w-none">
          {getServiceTitle("Ticketing")}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <button className="relative group p-2 rounded-xl hover:bg-accent transition-all">
          <Bell className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </button>

        <div className="h-8 w-[1px] bg-border mx-1 hidden sm:block" />

        {user ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-3 rounded-2xl hover:bg-accent p-1.5 transition-all group"
              aria-expanded={profileOpen}
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold text-xs shadow-lg">
                {name[0]?.toUpperCase() ?? <UserIcon className="h-4 w-4" />}
              </div>
              <div className="hidden md:block text-left mr-1">
                <p className="text-xs font-black text-foreground truncate max-w-[120px]">{name}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {role || "Agent"}
                </p>
              </div>
              <ChevronDown
                className={cn("h-4 w-4 text-muted-foreground transition-transform duration-300", profileOpen && "rotate-180")}
              />
            </button>

            <AccountPanel
              open={profileOpen}
              onClose={() => setProfileOpen(false)}
              user={{ name, email: (user as { email?: string })?.email ?? "" }}
              onSignOut={() => {
                setProfileOpen(false);
                void logout();
              }}
            >
              <div className="flex flex-col gap-3">
                <p className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {role || "Agent"}
                </p>
                <Link
                  href={orgRoute(orgSlug, "/admin/settings")}
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary"
                >
                  <Settings className="h-4 w-4" /> Settings
                </Link>
                <AppSwitcherGrid services={services} onNavigate={() => setProfileOpen(false)} />
              </div>
            </AccountPanel>
          </div>
        ) : (
          <Button size="sm" onClick={() => void redirectToSSO(undefined, orgSlug)} className="rounded-xl px-4">
            <LogIn className="h-4 w-4" />
            Sign in
          </Button>
        )}
      </div>
    </header>
  );
}
