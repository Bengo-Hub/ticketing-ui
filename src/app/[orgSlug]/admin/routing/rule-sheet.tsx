"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { SearchableCombobox, type ComboboxOption } from "@bengo-hub/shared-ui-lib/combobox";
import { FormSheet } from "@/components/common/form-sheet";
import { Field, SwitchField } from "@/components/common/field";
import { Button, Input } from "@/components/ui/base";
import { useCreateRoutingRule, useUpdateRoutingRule } from "@/hooks/useRouting";
import { PRIORITY_OPTIONS } from "@/lib/ticket-options";
import type { ActionType, RoutingAction, RoutingCondition, RoutingRule } from "@/types/routing";
import { ConditionRow } from "./condition-editor";
import { ACTION_OPTIONS, blankCondition, conditionIsComplete } from "./routing-options";

export function RuleSheet({
  orgSlug,
  rule,
  open,
  onOpenChange,
  categoryOptions,
  teamOptions,
  agentOptions,
}: {
  orgSlug: string;
  rule: RoutingRule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryOptions: ComboboxOption[];
  teamOptions: ComboboxOption[];
  agentOptions: ComboboxOption[];
}) {
  const [name, setName] = useState(rule?.name ?? "");
  const [description, setDescription] = useState(rule?.description ?? "");
  const [active, setActive] = useState(rule?.is_active ?? true);
  const [sortOrder, setSortOrder] = useState(String(rule?.sort_order ?? 0));
  const [conditions, setConditions] = useState<RoutingCondition[]>(
    rule?.conditions?.length ? rule.conditions : [blankCondition()],
  );
  const [action, setAction] = useState<RoutingAction>(rule?.action ?? { type: "assign_team", value: "" });
  const [error, setError] = useState<string | null>(null);
  const create = useCreateRoutingRule(orgSlug);
  const update = useUpdateRoutingRule(orgSlug);
  const pending = create.isPending || update.isPending;

  const actionValueOptions =
    action.type === "assign_team" ? teamOptions : action.type === "assign_agent" ? agentOptions : PRIORITY_OPTIONS;

  const save = async () => {
    setError(null);
    const sort = /^\d+$/.test(sortOrder.trim()) ? Number(sortOrder) : NaN;
    if (name.trim().length < 2) return setError("Give the rule a name.");
    if (!conditions.every(conditionIsComplete)) return setError("Fill in every condition or remove it.");
    if (!action.value) return setError("Choose what the rule sets.");
    if (Number.isNaN(sort)) return setError("Order must be a whole number.");
    const payload = {
      name: name.trim(),
      description: description.trim(),
      is_active: active,
      sort_order: sort,
      conditions: conditions.map((c) => (typeof c.value === "string" ? { ...c, value: c.value.trim() } : c)),
      action,
    };
    try {
      if (rule) {
        await update.mutateAsync({ id: rule.id, data: payload });
        toast.success("Rule updated");
      } else {
        await create.mutateAsync({ ...payload, description: payload.description || undefined });
        toast.success("Rule created");
      }
      onOpenChange(false);
    } catch {
      setError("The rule could not be saved.");
    }
  };

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={rule ? `Edit ${rule.name}` : "New routing rule"}
      description="Rules are checked in order. The first active rule whose conditions all match a new ticket runs its action."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {rule ? "Save changes" : "Create rule"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
          <Field label="Name" htmlFor="rule-name" required>
            <Input id="rule-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Billing to finance team" />
          </Field>
          <Field label="Order" htmlFor="rule-order" hint="Lowest is checked first.">
            <Input
              id="rule-order"
              type="number"
              inputMode="numeric"
              min={0}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </Field>
          <Field label="Description" htmlFor="rule-desc" className="sm:col-span-2">
            <Input id="rule-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </div>

        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-medium">Conditions (all must match)</legend>
          {conditions.map((c, i) => (
            <ConditionRow
              key={i}
              condition={c}
              categoryOptions={categoryOptions}
              removable={conditions.length > 1}
              onChange={(next) => setConditions((cs) => cs.map((x, j) => (j === i ? next : x)))}
              onRemove={() => setConditions((cs) => cs.filter((_, j) => j !== i))}
            />
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => setConditions((cs) => [...cs, blankCondition()])}>
            <Plus className="h-4 w-4" /> Add condition
          </Button>
        </fieldset>

        <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <legend className="mb-1 text-sm font-medium sm:col-span-2">Action</legend>
          <SearchableCombobox
            options={ACTION_OPTIONS}
            value={action.type}
            onChange={(v) => v && setAction({ type: v as ActionType, value: "" })}
            clearable={false}
          />
          <SearchableCombobox
            options={actionValueOptions}
            value={action.value}
            onChange={(v) => setAction((a) => ({ ...a, value: v }))}
            placeholder={action.type === "set_priority" ? "Choose a priority" : action.type === "assign_team" ? "Choose a team" : "Choose an agent"}
            emptyText="Nothing to choose"
          />
        </fieldset>

        <SwitchField label="Active" description="Inactive rules are skipped." checked={active} onChange={setActive} />
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    </FormSheet>
  );
}
