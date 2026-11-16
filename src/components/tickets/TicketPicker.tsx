"use client";

import { useCallback } from "react";
import { SearchableCombobox, type ComboboxOption } from "@bengo-hub/shared-ui-lib/combobox";
import { getTickets } from "@/lib/api/tickets";
import { useT } from "@/hooks/useT";
import { useTicketLabels } from "@/lib/ticket-options";

/** At most this many matches are offered. */
const PICKER_LIMIT = 10;

/**
 * Finds another ticket of the tenant by number ("TKT-000042", "42") or by words of its subject,
 * through the list API's search. The ticket on screen is left out.
 */
export function TicketPicker({
  orgSlug,
  excludeId,
  value,
  valueLabel,
  onChange,
  disabled,
}: {
  orgSlug: string;
  excludeId: string;
  value: string;
  valueLabel?: string;
  onChange: (id: string, option?: ComboboxOption) => void;
  disabled?: boolean;
}) {
  const { t } = useT();
  const labels = useTicketLabels();
  const search = useCallback(
    async (q: string, ctx: { signal: AbortSignal }): Promise<ComboboxOption[]> => {
      const page = await getTickets({ tenantSlug: orgSlug, search: q, limit: PICKER_LIMIT }, ctx.signal);
      return page.data
        .filter((tk) => tk.id !== excludeId)
        .map((tk) => ({
          value: tk.id,
          label: `#${tk.ticket_number} ${tk.subject}`,
          hint: labels.status(tk.status),
        }));
    },
    [orgSlug, excludeId, labels],
  );

  return (
    <SearchableCombobox
      options={[]}
      value={value}
      valueLabel={valueLabel}
      onChange={onChange}
      onRemoteSearch={search}
      remoteThreshold={PICKER_LIMIT + 1}
      placeholder={t("ticketPicker.placeholder")}
      searchPlaceholder={t("ticketPicker.search")}
      emptyText={t("ticketPicker.empty")}
      errorText={t("ticketPicker.error")}
      disabled={disabled}
    />
  );
}
