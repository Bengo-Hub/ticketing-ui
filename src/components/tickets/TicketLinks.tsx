"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Link2, Loader2, Plus, Unlink } from "lucide-react";
import { toast } from "sonner";
import { SearchableCombobox, type ComboboxOption } from "@bengo-hub/shared-ui-lib/combobox";
import { Button } from "@/components/ui/base";
import { TicketStatusBadge } from "@/components/tickets/TicketStatusBadge";
import { TicketPicker } from "@/components/tickets/TicketPicker";
import { useLinkTicket, useTicketLinks, useUnlinkTicket } from "@/hooks/useTicketLinks";
import { useT } from "@/hooks/useT";
import type { MessageKey } from "@/lib/i18n";
import { orgRoute } from "@/lib/utils";
import type { LinkRelation } from "@/types/workspace";

const RELATIONS: { value: LinkRelation; label: MessageKey; group: MessageKey }[] = [
  { value: "parent", label: "links.kindParent", group: "links.groupParent" },
  { value: "child", label: "links.kindChild", group: "links.groupChild" },
  { value: "related", label: "links.kindRelated", group: "links.groupRelated" },
  { value: "duplicate", label: "links.kindDuplicate", group: "links.groupDuplicate" },
];

const statusOf = (err: unknown) => (err as { response?: { status?: number } })?.response?.status;

/**
 * Parent, child, related and duplicate tickets. "Parent" picks the other ticket as this one's
 * parent; "child" makes it a child. Changing links needs tickets.change.
 */
export function TicketLinks({ orgSlug, ticketId, canChange }: { orgSlug: string; ticketId: string; canChange: boolean }) {
  const { t } = useT();
  const { data: links = [], isLoading } = useTicketLinks(orgSlug, ticketId);
  const link = useLinkTicket(orgSlug, ticketId);
  const unlink = useUnlinkTicket(orgSlug, ticketId);
  const [adding, setAdding] = useState(false);
  const [relation, setRelation] = useState<LinkRelation>("related");
  const [otherId, setOtherId] = useState("");
  const [otherLabel, setOtherLabel] = useState("");

  const relationOptions = useMemo<ComboboxOption[]>(
    () => RELATIONS.map((r) => ({ value: r.value, label: t(r.label) })),
    [t],
  );

  const add = async () => {
    if (!otherId) return;
    try {
      // The API names the kind from this ticket's side: "parent" makes this ticket the parent.
      // The picker reads the other way round ("the other ticket is my parent"), so it is flipped.
      const kind: LinkRelation = relation === "parent" ? "child" : relation === "child" ? "parent" : relation;
      await link.mutateAsync({ ticket_id: otherId, kind });
      toast.success(t("links.added"));
      setOtherId("");
      setOtherLabel("");
      setAdding(false);
    } catch (err) {
      const s = statusOf(err);
      toast.error(s === 409 ? t("links.exists") : s === 400 ? t("links.invalid") : t("links.addFailed"));
    }
  };

  const remove = async (linkId: string, other?: string) => {
    try {
      await unlink.mutateAsync({ linkId, otherId: other });
      toast.success(t("links.removed"));
    } catch {
      toast.error(t("links.removeFailed"));
    }
  };

  return (
    <section aria-label={t("links.title")} className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Link2 className="h-3.5 w-3.5" /> {t("links.title")}
        </h2>
        {canChange && !adding && (
          <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" /> {t("links.add")}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="h-10 animate-pulse rounded-md bg-muted" />
      ) : links.length === 0 && !adding ? (
        <p className="text-xs text-muted-foreground">{t("links.none")}</p>
      ) : (
        RELATIONS.map((r) => {
          const group = links.filter((l) => l.relation === r.value && l.ticket);
          if (group.length === 0) return null;
          return (
            <div key={r.value} className="space-y-1.5">
              <h3 className="text-[11px] font-semibold text-muted-foreground">{t(r.group)}</h3>
              <ul className="space-y-1.5">
                {group.map((l) => (
                  <li key={l.id} className="flex items-center gap-2 text-sm">
                    <Link href={orgRoute(orgSlug, `/tickets/${l.ticket!.id}`)} className="min-w-0 flex-1 truncate hover:underline">
                      <span className="font-mono text-xs font-semibold text-muted-foreground">#{l.ticket!.ticket_number}</span>{" "}
                      {l.ticket!.subject}
                    </Link>
                    <TicketStatusBadge status={l.ticket!.status} />
                    {canChange && (
                      <button
                        type="button"
                        onClick={() => void remove(l.id, l.ticket?.id)}
                        disabled={unlink.isPending}
                        aria-label={t("links.remove", { number: l.ticket!.ticket_number })}
                        className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-destructive"
                      >
                        <Unlink className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })
      )}

      {adding && (
        <div className="space-y-2 rounded-lg border border-dashed border-border p-2.5">
          <SearchableCombobox
            options={relationOptions}
            value={relation}
            onChange={(v) => v && setRelation(v as LinkRelation)}
            clearable={false}
            searchPlaceholder={t("links.kind")}
          />
          <TicketPicker
            orgSlug={orgSlug}
            excludeId={ticketId}
            value={otherId}
            valueLabel={otherLabel}
            onChange={(id, option) => {
              setOtherId(id);
              setOtherLabel(option?.label ?? "");
            }}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setAdding(false)} disabled={link.isPending}>
              {t("common.cancel")}
            </Button>
            <Button size="sm" onClick={() => void add()} disabled={!otherId || link.isPending}>
              {link.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("links.add")}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
