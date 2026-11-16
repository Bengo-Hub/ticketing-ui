"use client";

import { cn, orgRoute } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { HeadphonesIcon, LogOut, X } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useBranding } from "@/providers/branding-provider";
import { useServicePermissions } from "@/hooks/useServicePermissions";
import { visibleNav, type NavItem } from "@/lib/nav";

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

function NavLinks({
  title,
  items,
  orgSlug,
  pathname,
  onNavigate,
}: {
  title: string;
  items: NavItem[];
  orgSlug: string;
  pathname: string;
  onNavigate?: () => void;
}) {
  // The longest matching href wins, so "/admin" is not also lit on "/admin/teams".
  const activeHref = items
    .map((i) => i.href)
    .filter((href) => {
      const full = orgRoute(orgSlug, href);
      return pathname === full || pathname.startsWith(`${full}/`);
    })
    .sort((a, b) => b.length - a.length)[0];

  return (
    <div className="mt-6">
      <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-sidebar-muted">{title}</p>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.href === activeHref;
          return (
            <Link
              key={item.id}
              href={orgRoute(orgSlug, item.href)}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname() ?? "";
  const params = useParams();
  const orgSlug = (params.orgSlug as string) || "";
  const logout = useAuthStore((s) => s.logout);
  const { tenant } = useBranding();
  const { can } = useServicePermissions(orgSlug);
  const sections = visibleNav(can);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={onClose} aria-hidden />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-300",
          "lg:static lg:z-auto lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-1 flex-col overflow-y-auto px-3 py-5">
          <div className="flex items-center justify-between px-3">
            <Link href={`/${orgSlug}`} onClick={onClose} className="flex min-w-0 items-center gap-3">
              {tenant?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tenant.logoUrl} alt={tenant.name} className="h-9 w-auto object-contain" />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary">
                  <HeadphonesIcon className="h-5 w-5 text-primary-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{tenant?.orgName || "Support"}</p>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted">Ticketing</p>
              </div>
            </Link>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="rounded-lg p-1.5 text-sidebar-muted hover:bg-sidebar-accent lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {sections.map((s) => (
            <NavLinks
              key={s.title}
              title={s.title}
              items={s.items}
              orgSlug={orgSlug}
              pathname={pathname}
              onNavigate={onClose}
            />
          ))}
        </div>

        <div className="border-t border-sidebar-border p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:pb-3">
          <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent px-3 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-xs font-bold uppercase text-primary">
              {tenant?.name?.[0] || orgSlug?.[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{tenant?.name || orgSlug}</p>
              <p className="text-[10px] text-sidebar-muted">Support hub</p>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-lg p-2 text-sidebar-muted transition-colors hover:text-destructive"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
