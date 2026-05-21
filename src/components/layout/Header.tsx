"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/base";
import { cn, orgRoute } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { Bell, ChevronDown, LogIn, LogOut, Menu, Settings, UserIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useBranding } from "@/providers/branding-provider";

function displayName(user: { fullName?: string; firstName?: string; email?: string } | null): string {
  if (!user) return "Account";
  return user.fullName ?? user.firstName ?? user.email?.split("@")[0] ?? "Account";
}

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const params = useParams();
  const orgSlug = (params.orgSlug as string) || "codevertex";
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const redirectToSSO = useAuthStore((s) => s.redirectToSSO);
  const { getServiceTitle } = useBranding();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const name = displayName(user);
  const role = (user as { roles?: string[] } | null)?.roles?.[0] || (user as { role?: string } | null)?.role;

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
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-3 rounded-2xl hover:bg-accent p-1.5 transition-all group"
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

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-2xl p-2 shadow-2xl border border-border bg-card">
                  <div className="mb-2 px-3 py-2">
                    <p className="text-sm font-black text-foreground">{name}</p>
                    <p className="text-[10px] text-muted-foreground truncate font-bold uppercase tracking-widest mt-0.5">
                      {role || "Agent"}
                    </p>
                  </div>
                  <div className="h-[1px] bg-border my-2" />
                  <Link
                    href={orgRoute(orgSlug, "/admin/settings")}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold text-muted-foreground hover:bg-accent transition-all group"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      void logout();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </>
            )}
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
