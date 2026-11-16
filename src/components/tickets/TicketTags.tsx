"use client";

import { useMemo } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { SearchableCombobox, type ComboboxOption } from "@bengo-hub/shared-ui-lib/combobox";
import { Field } from "@/components/common/field";
import { useTicketTags, useUpdateTicket } from "@/hooks/useTickets";
import { useT } from "@/hooks/useT";
import type { Ticket } from "@/types/tickets";

/** The API keeps at most 20 tags on a ticket, each lower-cased and up to 50 characters. */
const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 50;

const normalise = (tag: string) => tag.trim().replace(/\s+/g, " ").toLowerCase().slice(0, MAX_TAG_LENGTH);

/** The ticket's tags: remove one with its cross, add one from the tenant's tags or a new one. */
export function TicketTags({ orgSlug, ticket, canChange }: { orgSlug: string; ticket: Ticket; canChange: boolean }) {
  const { t } = useT();
  const current = useMemo(() => ticket.tags ?? [], [ticket.tags]);
  const tags = useTicketTags(orgSlug, canChange);
  const update = useUpdateTicket(orgSlug, ticket.id);

  const options = useMemo<ComboboxOption[]>(
    () =>
      (tags.data ?? [])
        .filter((tc) => !current.includes(tc.tag))
        .map((tc) => ({ value: tc.tag, label: tc.tag, hint: String(tc.count) })),
    [tags.data, current],
  );

  const save = async (next: string[], done: string) => {
    try {
      await update.mutateAsync({ tags: next });
      toast.success(done);
    } catch {
      toast.error(t("tags.saveFailed"));
    }
  };

  const add = (raw: string) => {
    const tag = normalise(raw);
    if (!tag || current.includes(tag)) return;
    if (current.length >= MAX_TAGS) {
      toast.error(t("tags.tooMany", { n: MAX_TAGS }));
      return;
    }
    void save([...current, tag], t("tags.added", { tag }));
  };

  return (
    <Field label={t("tags.title")}>
      <div className="space-y-2">
        {current.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {current.map((tag) => (
              <li
                key={tag}
                className="flex items-center gap-1 rounded-full bg-secondary py-0.5 pl-2.5 pr-1 text-xs text-secondary-foreground"
              >
                <span className="max-w-40 truncate">{tag}</span>
                {canChange && (
                  <button
                    type="button"
                    onClick={() => void save(current.filter((x) => x !== tag), t("tags.removed", { tag }))}
                    disabled={update.isPending}
                    aria-label={t("tags.remove", { tag })}
                    className="rounded-full p-0.5 hover:bg-background"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">{t("tags.noneOnTicket")}</p>
        )}
        {canChange && (
          <SearchableCombobox
            options={options}
            value=""
            onChange={(v) => v && add(v)}
            onCreate={(text) => add(text)}
            createLabel={t("tags.addNew")}
            placeholder={t("tags.add")}
            searchPlaceholder={t("tags.search")}
            emptyText={t("tags.none")}
            disabled={update.isPending}
          />
        )}
      </div>
    </Field>
  );
}
