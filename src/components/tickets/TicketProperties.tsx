"use client";

import { toast } from "sonner";
import { SearchableCombobox } from "@bengo-hub/shared-ui-lib/combobox";
import { Field } from "@/components/common/field";
import { useAssignTicket, useUpdateTicket, useUpdateTicketStatus } from "@/hooks/useTickets";
import { useLookups } from "@/hooks/useLookups";
import { useServicePermissions } from "@/hooks/useServicePermissions";
import { PERM } from "@/lib/rbac/permissions";
import { PRIORITY_OPTIONS, STATUS_LABEL, statusOptionsFrom } from "@/lib/ticket-options";
import type { Ticket, TicketPriority, TicketStatus } from "@/types/tickets";

/**
 * Editable ticket fields. Each picker saves on change. Fields the person may not change are shown
 * disabled; the status list offers only the moves the API accepts from the current status.
 */
export function TicketProperties({ orgSlug, ticket }: { orgSlug: string; ticket: Ticket }) {
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
    void run(updateStatus.mutateAsync({ id: ticket.id, status }), `Status set to ${STATUS_LABEL[status]}`, "The status could not be changed.");
  };
  const setPriority = (v: string) => {
    if (!v || v === ticket.priority) return;
    void run(updateTicket.mutateAsync({ priority: v as TicketPriority }), "Priority updated", "The priority could not be changed.");
  };
  const setCategory = (v: string) => {
    if (!v || v === ticket.category_id) return;
    void run(updateTicket.mutateAsync({ category_id: v }), "Category updated", "The category could not be changed.");
  };
  const setTeam = (v: string) => {
    if (!v || v === ticket.assigned_team_id) return;
    void run(assign.mutateAsync({ id: ticket.id, teamId: v }), "Team assigned", "The team could not be assigned.");
  };
  const setAgent = (v: string) => {
    if (!v || v === ticket.assigned_agent_id) return;
    void run(assign.mutateAsync({ id: ticket.id, agentId: v }), "Agent assigned", "The agent could not be assigned.");
  };

  return (
    <section aria-label="Properties" className="space-y-3 rounded-xl border border-border bg-card p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Properties</h2>
      <Field label="Status">
        <SearchableCombobox
          options={statusOptionsFrom(ticket.status)}
          value={ticket.status}
          onChange={setStatus}
          clearable={false}
          disabled={!canChangeOwn || busy || ticket.status === "cancelled"}
          searchPlaceholder="Status"
        />
      </Field>
      <Field label="Priority">
        <SearchableCombobox
          options={PRIORITY_OPTIONS}
          value={ticket.priority}
          onChange={setPriority}
          clearable={false}
          disabled={!canChange || busy}
          searchPlaceholder="Priority"
        />
      </Field>
      <Field label="Category">
        <SearchableCombobox
          options={categoryOptions}
          value={ticket.category_id ?? ""}
          valueLabel={categoryName(ticket.category_id)}
          onChange={setCategory}
          clearable={false}
          disabled={!canChangeOwn || busy}
          placeholder="No category"
          searchPlaceholder="Category"
          emptyText="No categories"
        />
      </Field>
      <Field label="Team">
        <SearchableCombobox
          options={teamOptions}
          value={ticket.assigned_team_id ?? ""}
          valueLabel={teamName(ticket.assigned_team_id)}
          onChange={setTeam}
          clearable={false}
          disabled={!canChange || busy}
          placeholder="No team"
          searchPlaceholder="Team"
          emptyText="No teams"
        />
      </Field>
      <Field label="Assignee">
        <SearchableCombobox
          options={agentOptions}
          value={ticket.assigned_agent_id ?? ""}
          valueLabel={agentName(ticket.assigned_agent_id)}
          onChange={setAgent}
          clearable={false}
          disabled={!canChange || busy}
          placeholder="Unassigned"
          searchPlaceholder="Agent"
          emptyText="No agents"
        />
      </Field>
    </section>
  );
}
