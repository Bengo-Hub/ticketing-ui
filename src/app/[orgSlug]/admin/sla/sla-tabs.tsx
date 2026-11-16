"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useServicePermissions } from "@/hooks/useServicePermissions";
import { useT } from "@/hooks/useT";
import type { MessageKey } from "@/lib/i18n";
import { PERM, type Permission } from "@/lib/rbac/permissions";
import { cn, orgRoute } from "@/lib/utils";

const TABS: { href: string; label: MessageKey; anyOf: Permission[] }[] = [
  { href: "/admin/sla", label: "slaPolicies.tab", anyOf: [PERM.slaView] },
  { href: "/admin/sla/calendars", label: "slaCalendars.tab", anyOf: [PERM.slaView] },
  { href: "/admin/sla/report", label: "slaReport.tab", anyOf: [PERM.analyticsView] },
];

/** Links between the SLA policies, calendars and report pages, limited to what the person may open. */
export function SLATabs({ orgSlug }: { orgSlug: string }) {
  const { t } = useT();
  const pathname = usePathname() ?? "";
  const { can } = useServicePermissions(orgSlug);
  const tabs = TABS.filter((tab) => can(...tab.anyOf));
  if (tabs.length < 2) return null;

  return (
    <nav aria-label={t("slaPolicies.tabsLabel")} className="-mx-1 overflow-x-auto px-1">
      <div className="inline-flex rounded-lg bg-muted p-1">
        {tabs.map((tab) => {
          const href = orgRoute(orgSlug, tab.href);
          const active = pathname === href;
          return (
            <Link
              key={tab.href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(tab.label)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
