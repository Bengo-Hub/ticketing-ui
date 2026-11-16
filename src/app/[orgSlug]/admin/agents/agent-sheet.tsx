"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SearchableCombobox, type ComboboxOption } from "@bengo-hub/shared-ui-lib/combobox";
import { FormSheet } from "@/components/common/form-sheet";
import { Field, SwitchField } from "@/components/common/field";
import { Button, Input } from "@/components/ui/base";
import { useCreateAgent, useUpdateAgent } from "@/hooks/useAgents";
import type { Agent, AgentRole, AgentStatus } from "@/types/agents";
import { AGENT_STATUS_LABEL, ROLE_LABEL } from "./agents-columns";

const ROLE_OPTIONS: ComboboxOption[] = (Object.keys(ROLE_LABEL) as AgentRole[]).map((v) => ({ value: v, label: ROLE_LABEL[v] }));
const STATUS_OPTIONS: ComboboxOption[] = (Object.keys(AGENT_STATUS_LABEL) as AgentStatus[]).map((v) => ({
  value: v,
  label: AGENT_STATUS_LABEL[v],
}));

interface Draft {
  user_id: string;
  email: string;
  display_name: string;
  team_id: string;
  role: AgentRole;
  status: AgentStatus;
  max_concurrent_tickets: string;
  is_active: boolean;
}

function draftFrom(agent: Agent | null): Draft {
  return {
    user_id: agent?.user_id ?? "",
    email: agent?.email ?? "",
    display_name: agent?.display_name ?? "",
    team_id: agent?.team_id ?? "",
    role: agent?.role ?? "agent",
    status: agent?.status ?? "available",
    max_concurrent_tickets: String(agent?.max_concurrent_tickets ?? 10),
    is_active: agent?.is_active ?? true,
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Edits an agent, or (for admins) adds one by hand. Staff normally become agents on their first
 * sign-in, so the manual form is only a fallback and needs the person's SSO user id.
 */
export function AgentSheet({
  orgSlug,
  open,
  onOpenChange,
  agent,
  teamOptions,
}: {
  orgSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The agent to edit; null adds a new one. */
  agent: Agent | null;
  teamOptions: ComboboxOption[];
}) {
  const [draft, setDraft] = useState<Draft>(() => draftFrom(agent));
  const [error, setError] = useState<string | null>(null);
  const create = useCreateAgent(orgSlug);
  const update = useUpdateAgent(orgSlug);
  const pending = create.isPending || update.isPending;
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const save = async () => {
    setError(null);
    const max = Number(draft.max_concurrent_tickets);
    if (draft.display_name.trim().length < 2) return setError("Enter the agent's name.");
    if (!Number.isInteger(max) || max < 1) return setError("Open ticket limit must be a whole number of at least 1.");
    try {
      if (agent) {
        await update.mutateAsync({
          id: agent.id,
          data: {
            display_name: draft.display_name.trim(),
            team_id: draft.team_id || undefined,
            role: draft.role,
            status: draft.status,
            max_concurrent_tickets: max,
            is_active: draft.is_active,
          },
        });
        toast.success("Agent updated");
      } else {
        if (!UUID.test(draft.user_id.trim())) return setError("Enter the person's SSO user id.");
        if (!/^\S+@\S+\.\S+$/.test(draft.email.trim())) return setError("Enter a valid email address.");
        await create.mutateAsync({
          user_id: draft.user_id.trim(),
          email: draft.email.trim(),
          display_name: draft.display_name.trim(),
          team_id: draft.team_id || undefined,
          role: draft.role,
          max_concurrent_tickets: max,
        });
        toast.success("Agent added");
      }
      onOpenChange(false);
    } catch {
      setError(agent ? "The agent could not be saved." : "The agent could not be added.");
    }
  };

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={agent ? `Edit ${agent.display_name}` : "Add agent manually"}
      description={
        agent
          ? agent.email
          : "Staff become agents on their first sign-in to Ticketing. Add someone here only when they need to be assigned work before that."
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {agent ? "Save changes" : "Add agent"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {!agent && (
          <>
            <Field label="SSO user id" htmlFor="agent-user" required hint="From the person's profile in the Account Portal.">
              <Input id="agent-user" value={draft.user_id} onChange={(e) => set("user_id", e.target.value)} />
            </Field>
            <Field label="Email" htmlFor="agent-email" required>
              <Input id="agent-email" type="email" value={draft.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
          </>
        )}
        <Field label="Display name" htmlFor="agent-name" required>
          <Input id="agent-name" value={draft.display_name} onChange={(e) => set("display_name", e.target.value)} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Role">
            <SearchableCombobox
              options={ROLE_OPTIONS}
              value={draft.role}
              onChange={(v) => v && set("role", v as AgentRole)}
              clearable={false}
            />
          </Field>
          {agent && (
            <Field label="Status">
              <SearchableCombobox
                options={STATUS_OPTIONS}
                value={draft.status}
                onChange={(v) => v && set("status", v as AgentStatus)}
                clearable={false}
              />
            </Field>
          )}
          <Field label="Team">
            <SearchableCombobox
              options={teamOptions}
              value={draft.team_id}
              onChange={(v) => set("team_id", v)}
              placeholder="No team"
              searchPlaceholder="Team"
              emptyText="No teams"
            />
          </Field>
          <Field label="Open ticket limit" htmlFor="agent-max" hint="The most open tickets this agent should hold at once.">
            <Input
              id="agent-max"
              type="number"
              inputMode="numeric"
              min={1}
              value={draft.max_concurrent_tickets}
              onChange={(e) => set("max_concurrent_tickets", e.target.value)}
            />
          </Field>
        </div>
        {agent && (
          <SwitchField
            label="Active"
            description="Inactive agents cannot be assigned tickets."
            checked={draft.is_active}
            onChange={(v) => set("is_active", v)}
          />
        )}
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    </FormSheet>
  );
}
