"use client";

import { cn, orgRoute } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import {
  BookOpen,
  ClipboardList,
  HeadphonesIcon,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Settings,
  Shield,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useBranding } from "@/providers/branding-provider";

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

const mainNav = [
  { id: "tickets", label: "All Tickets", href: "/tickets", icon: ClipboardList },
  { id: "new-ticket", label: "Create Ticket", href: "/tickets/new", icon: PlusCircle },
  { id: "kb", label: "Knowledge Base", href: "/kb", icon: BookOpen },
];

const agentNav = [
  { id: "agent-inbox", label: "My Inbox", href: "/agent", icon: HeadphonesIcon },
];

const adminNav = [
  { id: "admin", label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { id: "admin-teams", label: "Teams", href: "/admin/teams", icon: Users },
  { id: "admin-agents", label: "Agents", href: "/admin/agents", icon: Shield },
  { id: "admin-settings", label: "Settings", href: "/admin/settings", icon: Settings },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const params = useParams();
  const orgSlug = (params.orgSlug as string) || "codevertex";
  const logout = useAuthStore((s) => s.logout);
  const { tenant } = useBranding();

  const isActive = (href: string) => {
    const full = orgRoute(orgSlug, href);
    if (href === "") return pathname === `/${orgSlug}` || pathname === `/${orgSlug}/`;
    return pathname.startsWith(full.split("?")[0]);
  };

  const NavSection = ({
    title,
    items,
  }: {
    title: string;
    items: typeof mainNav;
  }) => (
    <div className="mt-6">
      <div className="px-6 pb-2">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{title}</p>
      </div>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.id}
              href={orgRoute(orgSlug, item.href)}
              onClick={onClose}
              className={cn(
                "group flex items-center gap-4 px-6 py-3.5 rounded-2xl transition-all duration-300",
                active
                  ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]"
                  : "text-white/50 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform duration-300 group-hover:scale-110",
                  active ? "text-white" : "group-hover:text-white",
                )}
              />
              <span className="font-bold text-xs uppercase tracking-widest">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );

  const content = (
    <div className="flex flex-col h-full bg-slate-900 text-white border-r border-white/10 min-w-[280px]">
      <div className="px-6 py-6 flex flex-col flex-1 overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center justify-between mb-8">
          <Link href={`/${orgSlug}`} onClick={onClose} className="flex items-center gap-3">
            {tenant?.logoUrl ? (
              <img
                src={tenant.logoUrl}
                alt={tenant.name}
                className="h-10 w-auto object-contain"
              />
            ) : (
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <HeadphonesIcon className="text-white h-5 w-5" />
              </div>
            )}
            <div>
              <p className="text-sm font-black text-white">
                {tenant?.orgName || "Support"}
              </p>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                Ticketing
              </p>
            </div>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4 text-white/50" />
          </button>
        </div>

        <NavSection title="Tickets" items={mainNav} />
        <NavSection title="Agent" items={agentNav} />
        <NavSection title="Admin" items={adminNav} />
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-white/5 text-white/70">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-xs font-black text-primary uppercase shadow-inner">
            {tenant?.name?.[0] || orgSlug?.[0]}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-black text-[10px] uppercase tracking-widest truncate">
              {tenant?.name || orgSlug}
            </span>
            <span className="text-[9px] font-bold opacity-50 uppercase tracking-tighter">
              Support Hub
            </span>
          </div>
          <button
            onClick={() => void logout()}
            className="p-2 rounded-xl hover:bg-white/5 transition-colors text-white/50 hover:text-rose-400"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:z-auto lg:translate-x-0 lg:min-w-[280px]",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex-1 overflow-y-auto">{content}</div>
      </aside>
    </>
  );
}
