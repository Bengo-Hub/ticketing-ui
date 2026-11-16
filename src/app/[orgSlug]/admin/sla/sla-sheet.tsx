"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SearchableCombobox, type ComboboxOption } from "@bengo-hub/shared-ui-lib/combobox";
import { FormSheet } from "@/components/common/form-sheet";
import { Field, SwitchField } from "@/components/common/field";
import { Button, Input } from "@/components/ui/base";
import { useCreateSLAPolicy, useUpdateSLAPolicy } from "@/hooks/useSLA";
import { useTicketLabels } from "@/lib/ticket-options";
import type { TicketPriority } from "@/types/tickets";
import type { SLAPolicy } from "@/types/sla";
import { formatMinutes } from "./sla-columns";

interface Draft {
  name: string;
  description: string;
  priority: TicketPriority;
  category_id: string;
  first_response_minutes: string;
  first_response_business_hours: boolean;
  resolution_minutes: string;
  resolution_business_hours: boolean;
  sort_order: string;
  is_active: boolean;
}

function draftFrom(p: SLAPolicy | null): Draft {
  return {
    name: p?.name ?? "",
    description: p?.description ?? "",
    priority: p?.priority ?? "normal",
    category_id: p?.category_id ?? "",
    first_response_minutes: String(p?.first_response_minutes ?? 60),
    first_response_business_hours: p?.first_response_business_hours ?? true,
    resolution_minutes: String(p?.resolution_minutes ?? 480),
    resolution_business_hours: p?.resolution_business_hours ?? true,
    sort_order: String(p?.sort_order ?? 0),
    is_active: p?.is_active ?? true,
  };
}

const whole = (v: string) => (/^\d+$/.test(v.trim()) ? Number(v) : NaN);

export function SLASheet({
  orgSlug,
  policy,
  open,
  onOpenChange,
  categoryOptions,
}: {
  orgSlug: string;
  policy: SLAPolicy | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryOptions: ComboboxOption[];
}) {
  const [d, setD] = useState<Draft>(() => draftFrom(policy));
  const [error, setError] = useState<string | null>(null);
  const labels = useTicketLabels();
  const create = useCreateSLAPolicy(orgSlug);
  const update = useUpdateSLAPolicy(orgSlug);
  const pending = create.isPending || update.isPending;
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));

  const save = async () => {
    setError(null);
    const first = whole(d.first_response_minutes);
    const resolution = whole(d.resolution_minutes);
    const sort = whole(d.sort_order || "0");
    if (d.name.trim().length < 2) return setError("Give the policy a name.");
    if (!(first > 0) || !(resolution > 0)) return setError("Both targets need a whole number of minutes above 0.");
    if (resolution < first) return setError("The resolution target cannot be shorter than the first response target.");
    if (Number.isNaN(sort)) return setError("Order must be a whole number.");
    const payload = {
      name: d.name.trim(),
      description: d.description.trim(),
      priority: d.priority,
      category_id: d.category_id || undefined,
      first_response_minutes: first,
      first_response_business_hours: d.first_response_business_hours,
      resolution_minutes: resolution,
      resolution_business_hours: d.resolution_business_hours,
      sort_order: sort,
    };
    try {
      if (policy) {
        await update.mutateAsync({ id: policy.id, data: { ...payload, is_active: d.is_active } });
        toast.success("Policy updated");
      } else {
        await create.mutateAsync({ ...payload, description: payload.description || undefined });
        toast.success("Policy created");
      }
      onOpenChange(false);
    } catch {
      setError("The policy could not be saved.");
    }
  };

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={policy ? `Edit ${policy.name}` : "New SLA policy"}
      description="Targets apply to new tickets of the chosen priority, and category when one is set."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {policy ? "Save changes" : "Create policy"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="sla-name" required className="sm:col-span-2">
            <Input id="sla-name" value={d.name} onChange={(e) => set("name", e.target.value)} placeholder="Urgent issues" />
          </Field>
          <Field label="Description" htmlFor="sla-desc" className="sm:col-span-2">
            <Input id="sla-desc" value={d.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <Field label="Priority" required>
            <SearchableCombobox
              options={labels.priorityOptions}
              value={d.priority}
              onChange={(v) => v && set("priority", v as TicketPriority)}
              clearable={false}
            />
          </Field>
          <Field label="Category" hint="Leave empty to cover every category.">
            <SearchableCombobox
              options={categoryOptions}
              value={d.category_id}
              onChange={(v) => set("category_id", v)}
              placeholder="Any category"
              emptyText="No categories"
            />
          </Field>
          <Field
            label="First response (minutes)"
            htmlFor="sla-first"
            required
            hint={formatMinutes(whole(d.first_response_minutes) || 0)}
          >
            <Input
              id="sla-first"
              type="number"
              inputMode="numeric"
              min={1}
              value={d.first_response_minutes}
              onChange={(e) => set("first_response_minutes", e.target.value)}
            />
          </Field>
          <Field label="Resolution (minutes)" htmlFor="sla-res" required hint={formatMinutes(whole(d.resolution_minutes) || 0)}>
            <Input
              id="sla-res"
              type="number"
              inputMode="numeric"
              min={1}
              value={d.resolution_minutes}
              onChange={(e) => set("resolution_minutes", e.target.value)}
            />
          </Field>
          <SwitchField
            label="Response counts business hours only"
            checked={d.first_response_business_hours}
            onChange={(v) => set("first_response_business_hours", v)}
          />
          <SwitchField
            label="Resolution counts business hours only"
            checked={d.resolution_business_hours}
            onChange={(v) => set("resolution_business_hours", v)}
          />
          <Field label="Order" htmlFor="sla-order" hint="When several policies match, the lowest number wins.">
            <Input
              id="sla-order"
              type="number"
              inputMode="numeric"
              min={0}
              value={d.sort_order}
              onChange={(e) => set("sort_order", e.target.value)}
            />
          </Field>
        </div>
        {policy && (
          <SwitchField label="Active" description="Inactive policies are not applied to new tickets." checked={d.is_active} onChange={(v) => set("is_active", v)} />
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
