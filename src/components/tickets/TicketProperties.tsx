"use client";

import { toast } from "sonner";
import { SearchableCombobox } from "@bengo-hub/shared-ui-lib/combobox";
import { Field } from "@/components/common/field";
import { TicketTags } from "@/components/tickets/TicketTags";
import { useAssignTicket, useUpdateTicket, useUpdateTicketStatus } from "@/hooks/useTickets";
import { useLookups } from "@/hooks/useLookups";
import { useServicePermissions } from "@/hooks/useServicePermissions";
import { useT } from "@/hooks/useT";
import { PERM } from "@/lib/rbac/permissions";
import { useTicketLabels } from "@/lib/ticket-options";
import type { Ticket, TicketPriority, TicketStatus } from "@/types/tickets";

/**
 * Editable ticket fields. Each picker saves on change. Fields the person may not change are shown
 * disabled; the status list offers only the moves the API accepts from the current status.
 */
export function TicketProperties({ orgSlug, ticket }: { orgSlug: string; ticket: Ticket }) {
  const { t } = useT();
  const labels = useTicketLabels();
  const { can } = useServicePermissions(orgSlug);
  const { agentOptions, teamOptions, categoryOptions, agentName, teamName, categoryName } = useLookups(orgSlug);
  const updateTicket = useUpdateTicket(orgSlug, ticket.id);
  const updateStatus = useUpdateTicketStatus(orgSlug);
  const assign = useAssignTicket(orgSlug);

  const canChange = can(PERM.ticketsChange);
  const canChangeOwn = canChange || can(PERM.ticketsChangeOwn);
  const busy = updateTicket.isPending || updateStatus.isPending || assign.isPending;

  const run = async (work: Promise<unknown>, done: string, failed: string) => {
    try {
      await work;
      toast.success(done);
    } catch {
      toast.error(failed);
    }
  };

  const setStatus = (v: string) => {
    if (!v || v === ticket.status) return;
    const status = v as TicketStatus;
    void run(
      updateStatus.mutateAsync({ id: ticket.id, status }),
      t("ticket.statusSet", { status: labels.status(status) }),
      t("ticket.statusFailed"),
    );
  };
  const setPriority = (v: string) => {
    if (!v || v === ticket.priority) return;
    void run(updateTicket.mutateAsync({ priority: v as TicketPriority }), t("ticket.priorityUpdated"), t("ticket.priorityFailed"));
  };
  const setCategory = (v: string) => {
    if (!v || v === ticket.category_id) return;
    void run(updateTicket.mutateAsync({ category_id: v }), t("ticket.categoryUpdated"), t("ticket.categoryFailed"));
  };
  const setTeam = (v: string) => {
    if (!v || v === ticket.assigned_team_id) return;
    void run(assign.mutateAsync({ id: ticket.id, teamId: v }), t("ticket.teamAssigned"), t("ticket.teamFailed"));
  };
  const setAgent = (v: string) => {
    if (!v || v === ticket.assigned_agent_id) return;
    void run(assign.mutateAsync({ id: ticket.id, agentId: v }), t("ticket.agentAssigned"), t("ticket.agentFailed"));
  };

  return (
    <section aria-label={t("ticket.properties")} className="space-y-3 rounded-xl border border-border bg-card p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("ticket.properties")}</h2>
      <Field label={t("ticket.status")}>
        <SearchableCombobox
          options={labels.statusOptionsFrom(ticket.status)}
          value={ticket.status}
          onChange={setStatus}
          clearable={false}
          disabled={!canChangeOwn || busy || ticket.status === "cancelled"}
          searchPlaceholder={t("ticket.status")}
        />
      </Field>
      <Field label={t("ticket.priority")}>
        <SearchableCombobox
          options={labels.priorityOptions}
          value={ticket.priority}
          onChange={setPriority}
          clearable={false}
          disabled={!canChange || busy}
          searchPlaceholder={t("ticket.priority")}
        />
      </Field>
      <Field label={t("ticket.category")}>
        <SearchableCombobox
          options={categoryOptions}
          value={ticket.category_id ?? ""}
          valueLabel={categoryName(ticket.category_id)}
          onChange={setCategory}
          clearable={false}
          disabled={!canChangeOwn || busy}
          placeholder={t("ticket.noCategory")}
          searchPlaceholder={t("ticket.category")}
          emptyText={t("ticket.noCategories")}
        />
      </Field>
      <Field label={t("ticket.team")}>
        <SearchableCombobox
          options={teamOptions}
          value={ticket.assigned_team_id ?? ""}
          valueLabel={teamName(ticket.assigned_team_id)}
          onChange={setTeam}
          clearable={false}
          disabled={!canChange || busy}
          placeholder={t("ticket.noTeam")}
          searchPlaceholder={t("ticket.team")}
          emptyText={t("ticket.noTeams")}
        />
      </Field>
      <Field label={t("ticket.assignee")}>
        <SearchableCombobox
          options={agentOptions}
          value={ticket.assigned_agent_id ?? ""}
          valueLabel={agentName(ticket.assigned_agent_id)}
          onChange={setAgent}
          clearable={false}
          disabled={!canChange || busy}
          placeholder={t("ticket.unassigned")}
          searchPlaceholder={t("ticket.agent")}
          emptyText={t("ticket.noAgents")}
        />
      </Field>
      <TicketTags orgSlug={orgSlug} ticket={ticket} canChange={canChange} />
    </section>
  );
}
