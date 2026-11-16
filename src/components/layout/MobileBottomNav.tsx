"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { BookOpen, ClipboardList, HeadphonesIcon, Plus } from "lucide-react";
import { MobileBottomNav as SharedMobileBottomNav, type MobileNavTab } from "@bengo-hub/shared-ui-lib/navigation";
import { useServicePermissions } from "@/hooks/useServicePermissions";
import { PERM } from "@/lib/rbac/permissions";

interface Props {
  /** Opens the sidebar drawer for the "More" tab. */
  onOpenMenu: () => void;
}

/**
 * Bottom bar on phones and tablets (hidden from lg up). Agents get their inbox and the ticket list,
 * customers get their tickets and the knowledge base; the centre action raises a ticket. Layout comes
 * from the shared MobileBottomNav; this file only picks the tabs and gates them by permission.
 */
export function MobileBottomNav({ onOpenMenu }: Props) {
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) || "";
  const pathname = usePathname() ?? "";
  const { can, isStaff } = useServicePermissions(orgSlug);
  const base = `/${orgSlug}`;
  const at = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const tabs: MobileNavTab[] = [];
  if (isStaff && can(PERM.ticketsView)) {
    tabs.push({ key: "inbox", label: "Inbox", href: `${base}/agent`, icon: HeadphonesIcon, active: at(`${base}/agent`) });
  }
  if (can(PERM.ticketsView, PERM.ticketsViewOwn)) {
    tabs.push({
      key: "tickets",
      label: "Tickets",
      href: `${base}/tickets`,
      icon: ClipboardList,
      active: at(`${base}/tickets`) && !at(`${base}/tickets/new`),
    });
  }
  if (can(PERM.kbView)) {
    tabs.push({ key: "kb", label: "Help", href: `${base}/kb`, icon: BookOpen, active: at(`${base}/kb`) });
  }

  return (
    <div className="lg:hidden">
      <SharedMobileBottomNav
        tabs={tabs}
        centerAction={can(PERM.ticketsAdd) ? { label: "New ticket", href: `${base}/tickets/new`, icon: Plus } : undefined}
        onOpenMore={onOpenMenu}
        LinkComponent={Link}
      />
    </div>
  );
}
