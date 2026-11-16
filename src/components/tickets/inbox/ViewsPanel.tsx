"use client";

import { useState } from "react";
import * as Menu from "@radix-ui/react-dropdown-menu";
import { Bookmark, ChevronDown, Inbox, MoreHorizontal, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/base";
import { useDeleteView, useSaveView, useViews } from "@/hooks/useViews";
import { useT } from "@/hooks/useT";
import { cn } from "@/lib/utils";
import type { TicketView, ViewInput } from "@/types/workspace";
import { ViewSheet } from "./ViewSheet";

const MENU_ITEM =
  "flex cursor-pointer select-none items-center rounded-md px-2.5 py-1.5 text-sm outline-none data-highlighted:bg-accent data-highlighted:text-accent-foreground";

/**
 * Saved views beside the inbox: everything, the person's own views and the team's shared ones.
 * A private view is its owner's to change; a shared one needs tickets.manage, as on the API.
 * Below lg the list folds behind a toggle so the table keeps the width.
 */
export function ViewsPanel({
  orgSlug,
  activeId,
  current,
  selfUserId,
  canManage,
  onApply,
}: {
  orgSlug: string;
  activeId: string | null;
  current: Omit<ViewInput, "name" | "shared">;
  selfUserId?: string;
  canManage: boolean;
  onApply: (view: TicketView | null) => void;
}) {
  const { t } = useT();
  const { data: views = [], isLoading } = useViews(orgSlug);
  const save = useSaveView(orgSlug);
  const remove = useDeleteView(orgSlug);
  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState<{ view: TicketView | null } | null>(null);
  const [removing, setRemoving] = useState<TicketView | null>(null);

  const mine = views.filter((v) => !v.shared && v.owner_user_id === selfUserId);
  const shared = views.filter((v) => v.shared);
  const canEdit = (v: TicketView) => (v.shared ? canManage : v.owner_user_id === selfUserId);
  const active = views.find((v) => v.id === activeId);

  const replace = async (v: TicketView, data: Partial<ViewInput>, done: string) => {
    try {
      await save.mutateAsync({
        id: v.id,
        data: { name: v.name, filters: v.filters ?? {}, sort: v.sort, shared: v.shared, ...data },
      });
      toast.success(done);
    } catch {
      toast.error(t("views.saveFailed"));
    }
  };

  const onRemove = async () => {
    if (!removing) return;
    try {
      await remove.mutateAsync(removing.id);
      if (removing.id === activeId) onApply(null);
      toast.success(t("views.deleted"));
      setRemoving(null);
    } catch {
      toast.error(t("views.deleteFailed"));
    }
  };

  const row = (v: TicketView) => (
    <li key={v.id} className="group flex items-center gap-1">
      <button
        type="button"
        onClick={() => onApply(v)}
        aria-current={v.id === activeId ? "true" : undefined}
        className={cn(
          "min-w-0 flex-1 truncate rounded-md px-2.5 py-1.5 text-left text-sm transition-colors",
          v.id === activeId ? "bg-primary/10 font-medium text-primary" : "hover:bg-accent",
        )}
      >
        {v.name}
      </button>
      {canEdit(v) && (
        <Menu.Root>
          <Menu.Trigger
            aria-label={t("views.actions", { name: v.name })}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Content align="end" sideOffset={4} className="z-50 min-w-44 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md">
              <Menu.Item className={MENU_ITEM} onSelect={() => setSheet({ view: v })}>
                {t("views.rename")}
              </Menu.Item>
              <Menu.Item className={MENU_ITEM} onSelect={() => void replace(v, current, t("views.updated"))}>
                {t("views.useCurrent")}
              </Menu.Item>
              {canManage && (
                <Menu.Item
                  className={MENU_ITEM}
                  onSelect={() => void replace(v, { shared: !v.shared }, v.shared ? t("views.unshared") : t("views.sharedDone"))}
                >
                  {v.shared ? t("views.unshare") : t("views.share")}
                </Menu.Item>
              )}
              <Menu.Item className={cn(MENU_ITEM, "text-destructive")} onSelect={() => setRemoving(v)}>
                {t("common.delete")}
              </Menu.Item>
            </Menu.Content>
          </Menu.Portal>
        </Menu.Root>
      )}
    </li>
  );

  const section = (title: string, icon: React.ReactNode, list: TicketView[]) =>
    list.length > 0 && (
      <div className="space-y-1">
        <h3 className="flex items-center gap-1.5 px-2.5 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {icon} {title}
        </h3>
        <ul className="space-y-0.5">{list.map(row)}</ul>
      </div>
    );

  return (
    <nav aria-label={t("views.title")} className="rounded-xl border border-border bg-card p-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium lg:hidden"
      >
        <span className="flex min-w-0 items-center gap-2">
          <Bookmark className="h-4 w-4 shrink-0" />
          <span className="truncate">{active?.name ?? t("views.allTickets")}</span>
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      <div className={cn("space-y-1 pt-1 lg:block lg:pt-0", open ? "block" : "hidden")}>
        <h2 className="hidden px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:block">
          {t("views.title")}
        </h2>
        <button
          type="button"
          onClick={() => onApply(null)}
          aria-current={!activeId ? "true" : undefined}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors",
            !activeId ? "bg-primary/10 font-medium text-primary" : "hover:bg-accent",
          )}
        >
          <Inbox className="h-4 w-4" /> {t("views.allTickets")}
        </button>
        {isLoading ? (
          <div className="mx-2.5 my-2 h-16 animate-pulse rounded-md bg-muted" />
        ) : (
          <>
            {section(t("views.mine"), <Bookmark className="h-3 w-3" />, mine)}
            {section(t("views.shared"), <Users className="h-3 w-3" />, shared)}
            {mine.length + shared.length === 0 && <p className="px-2.5 py-2 text-xs text-muted-foreground">{t("views.none")}</p>}
          </>
        )}
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => setSheet({ view: null })}>
          <Plus className="h-4 w-4" /> {t("views.saveCurrent")}
        </Button>
      </div>

      {sheet && (
        <ViewSheet
          key={sheet.view?.id ?? "new"}
          orgSlug={orgSlug}
          view={sheet.view}
          current={current}
          canShare={canManage}
          open
          onOpenChange={(o) => !o && setSheet(null)}
          onSaved={(v) => !sheet.view && onApply(v)}
        />
      )}

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={t("views.deleteTitle", { name: removing?.name ?? "" })}
        description={removing?.shared ? t("views.deleteSharedBody") : undefined}
        confirmLabel={t("views.deleteConfirm")}
        loading={remove.isPending}
        onConfirm={() => void onRemove()}
      />
    </nav>
  );
}
