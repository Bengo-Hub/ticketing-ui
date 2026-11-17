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
import { PERM, type ServiceRole } from "@/lib/rbac/permissions";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LanguageSwitch } from "@/components/common/language-switch";
import { useT } from "@/hooks/useT";

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

function displayName(user: { fullName?: string; firstName?: string; email?: string } | null, fallback: string): string {
  if (!user) return fallback;
  return user.fullName ?? user.firstName ?? user.email?.split("@")[0] ?? fallback;
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
  const { t } = useT();
  const name = displayName(user, t("shell.account"));
  const { role: serviceRole, can } = useServicePermissions(orgSlug);
  const roleKey: ServiceRole = serviceRole ?? "agent";
  const role = t(`role.${roleKey}`);
  // The App Store shows every real service to every authenticated user in the tenant. Each
  // destination service already enforces its own RBAC + subscription gating on arrival, so
  // pre-filtering the directory here just hid apps that were actually reachable.
  const services = useVisibleServices({ orgSlug, urls: SERVICE_URLS, canManageLinks: true });

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-4 flex-1">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl hover:bg-accent transition-colors"
          aria-label={t("shell.openMenu")}
        >
          <Menu className="h-5 w-5 text-muted-foreground" />
        </button>
        <h1 className="text-lg font-black tracking-tight text-foreground uppercase truncate max-w-[110px] sm:max-w-none">
          {getServiceTitle(t("common.appName"))}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <LanguageSwitch />
        <ThemeToggle />
        <button type="button" aria-label={t("shell.notifications")} className="relative group hidden p-2 rounded-xl hover:bg-accent transition-all sm:block">
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
                  {role}
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
                  {role}
                </p>
                {can(PERM.settingsManage) && (
                  <Link
                    href={orgRoute(orgSlug, "/admin/settings")}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary"
                  >
                    <Settings className="h-4 w-4" /> {t("common.settings")}
                  </Link>
                )}
                <AppSwitcherGrid services={services} onNavigate={() => setProfileOpen(false)} />
              </div>
            </AccountPanel>
          </div>
        ) : (
          <Button size="sm" onClick={() => void redirectToSSO(orgSlug, window.location.href)} className="rounded-xl px-4">
            <LogIn className="h-4 w-4" />
            {t("common.signIn")}
          </Button>
        )}
      </div>
    </header>
  );
}
