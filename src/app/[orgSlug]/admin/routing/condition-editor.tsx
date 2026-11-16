"use client";

import { Trash2 } from "lucide-react";
import { MultiSelectCombobox, SearchableCombobox, type ComboboxOption } from "@bengo-hub/shared-ui-lib/combobox";
import { Input } from "@/components/ui/base";
import { useTicketLabels } from "@/lib/ticket-options";
import type { ConditionField, ConditionOperator, RoutingCondition } from "@/types/routing";
import { FIELD_OPTIONS, OPERATOR_LABEL, blankCondition, operatorsFor } from "./routing-options";

/** One "field operator value" row of a routing rule. */
export function ConditionRow({
  condition,
  onChange,
  onRemove,
  categoryOptions,
  removable,
}: {
  condition: RoutingCondition;
  onChange: (c: RoutingCondition) => void;
  onRemove: () => void;
  categoryOptions: ComboboxOption[];
  removable: boolean;
}) {
  const labels = useTicketLabels();
  const valueOptions: ComboboxOption[] | null =
    condition.field === "priority"
      ? labels.priorityOptions
      : condition.field === "channel"
        ? labels.channelOptions
        : condition.field === "category_id"
          ? categoryOptions
          : null;
  const operatorOptions = operatorsFor(condition.field).map((op) => ({ value: op, label: OPERATOR_LABEL[op] }));

  const setOperator = (op: ConditionOperator) => {
    // Switching between one value and a list keeps what was chosen.
    const current = Array.isArray(condition.value) ? condition.value : condition.value ? [condition.value] : [];
    onChange({ ...condition, operator: op, value: op === "in" ? current : (current[0] ?? "") });
  };

  return (
    <div className="grid grid-cols-1 gap-2 rounded-lg border border-border p-3 sm:grid-cols-[minmax(0,1fr)_8rem_minmax(0,1.4fr)_auto] sm:items-start">
      <SearchableCombobox
        options={FIELD_OPTIONS}
        value={condition.field}
        onChange={(v) => v && onChange(blankCondition(v as ConditionField))}
        clearable={false}
      />
      <SearchableCombobox
        options={operatorOptions}
        value={condition.operator}
        onChange={(v) => v && setOperator(v as ConditionOperator)}
        clearable={false}
        disabled={operatorOptions.length < 2}
      />
      {valueOptions === null ? (
        <Input
          value={typeof condition.value === "string" ? condition.value : ""}
          onChange={(e) => onChange({ ...condition, value: e.target.value })}
          placeholder="Words to look for"
          aria-label="Text to match"
        />
      ) : condition.operator === "in" ? (
        <MultiSelectCombobox
          options={valueOptions}
          values={Array.isArray(condition.value) ? condition.value : []}
          onChange={(values) => onChange({ ...condition, value: values })}
          placeholder="Choose values"
        />
      ) : (
        <SearchableCombobox
          options={valueOptions}
          value={typeof condition.value === "string" ? condition.value : ""}
          onChange={(v) => onChange({ ...condition, value: v })}
          placeholder="Choose a value"
        />
      )}
      <button
        type="button"
        onClick={onRemove}
        disabled={!removable}
        className="justify-self-end rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
        aria-label="Remove condition"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
