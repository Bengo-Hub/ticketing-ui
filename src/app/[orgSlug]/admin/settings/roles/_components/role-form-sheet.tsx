"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FormSheet } from "@/components/common/form-sheet";
import { Field } from "@/components/common/field";
import { Button, Input } from "@/components/ui/base";
import { useRbacMutation } from "@/hooks/useRbac";
import { useT } from "@/hooks/useT";
import { apiErrorText, cloneRole, createRole, updateRole, type Role } from "@/lib/api/rbac";

export type RoleFormMode = { kind: "create" } | { kind: "copy"; source: Role } | { kind: "edit"; role: Role };

/**
 * A new empty role, a copy starting from another role's permissions, or a new name and
 * description for one of the tenant's own roles. Mounted per use, so it starts from that role.
 */
export function RoleFormSheet({
  tenant,
  mode,
  onClose,
  onSaved,
}: {
  tenant: string;
  mode: RoleFormMode;
  onClose: () => void;
  onSaved: (role: Role) => void;
}) {
  const { t } = useT();
  const editing = mode.kind === "edit" ? mode.role : null;
  const [name, setName] = useState(editing?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");

  const save = useRbacMutation(tenant, () => {
    const input = { name: name.trim(), description: description.trim() || undefined };
    if (mode.kind === "edit") return updateRole(tenant, mode.role.id, input);
    if (mode.kind === "copy") return cloneRole(tenant, mode.source.id, input);
    return createRole(tenant, { ...input, permission_codes: [] });
  });

  const title =
    mode.kind === "edit"
      ? t("rbac.form.editTitle", { name: mode.role.name })
      : mode.kind === "copy"
        ? t("rbac.form.copyTitle", { name: mode.source.name })
        : t("rbac.form.newTitle");
  const hint =
    mode.kind === "edit" ? t("rbac.form.editHint") : mode.kind === "copy" ? t("rbac.form.copyHint") : t("rbac.form.newHint");
  const submitLabel =
    mode.kind === "edit" ? t("rbac.form.save") : mode.kind === "copy" ? t("rbac.form.copy") : t("rbac.form.create");
  const doneText =
    mode.kind === "edit" ? t("rbac.form.updated") : mode.kind === "copy" ? t("rbac.form.copied") : t("rbac.form.created");
  const valid = name.trim().length > 0;

  const submit = () =>
    save.mutate(undefined, {
      onSuccess: (role) => {
        toast.success(doneText);
        if (role) onSaved(role);
        onClose();
      },
      onError: (e) => toast.error(apiErrorText(e, t("rbac.form.failed"))),
    });

  return (
    <FormSheet
      open
      onOpenChange={(open) => !open && onClose()}
      size="sm"
      title={title}
      description={hint}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button disabled={!valid || save.isPending} onClick={submit}>
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid && !save.isPending) submit();
        }}
      >
        <Field label={t("rbac.form.name")} htmlFor="role-name" required>
          <Input id="role-name" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label={t("rbac.form.description")} htmlFor="role-description">
          <Input id="role-description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
      </form>
    </FormSheet>
  );
}
