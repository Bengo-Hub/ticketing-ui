"use client";

import { useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { SearchableCombobox, type ComboboxOption } from "@bengo-hub/shared-ui-lib/combobox";
import { FormSheet } from "@/components/common/form-sheet";
import { Field } from "@/components/common/field";
import { Badge, Button, Input } from "@/components/ui/base";
import { useNow } from "@/hooks/useNow";
import { useRbacMutation, useRoles } from "@/hooks/useRbac";
import { useT } from "@/hooks/useT";
import { apiErrorText, assignRole, revokeRole, type HeldRole, type TeamMember } from "@/lib/api/rbac";
import { formatDate } from "@/lib/utils";

/** The end of the chosen day in the browser's zone, as the API's expiry. */
function endOfDay(date: string): string | null {
  return date ? new Date(`${date}T23:59:59`).toISOString() : null;
}

function HeldRow({
  role,
  busy,
  canManage,
  onRemove,
}: {
  role: HeldRole;
  busy: boolean;
  canManage: boolean;
  onRemove: () => void;
}) {
  const { t } = useT();
  return (
    <li className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{role.name}</p>
        <p className="text-xs text-muted-foreground">
          {role.expired && role.expires_at
            ? t("rbac.member.ended", { date: formatDate(role.expires_at) })
            : role.expires_at
              ? t("rbac.member.until", { date: formatDate(role.expires_at) })
              : t("rbac.member.noEnd")}
        </p>
      </div>
      {role.expired ? (
        <Badge variant="outline">{t("rbac.member.endedBadge")}</Badge>
      ) : canManage ? (
        <Button
          size="icon"
          variant="ghost"
          disabled={busy}
          aria-label={t("rbac.member.remove", { name: role.name })}
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      ) : null}
    </li>
  );
}

/** The roles one person holds, with adding (optionally until a date) and removing. */
export function MemberRolesSheet({
  tenant,
  member,
  canManage,
  onClose,
}: {
  tenant: string;
  member: TeamMember;
  canManage: boolean;
  onClose: () => void;
}) {
  const { t } = useT();
  const now = useNow();
  const { data: roles = [] } = useRoles(tenant);
  const [roleId, setRoleId] = useState("");
  const [until, setUntil] = useState("");

  const grant = useRbacMutation(tenant, () => assignRole(tenant, member.id, roleId, endOfDay(until)));
  const remove = useRbacMutation(tenant, (id: string) => revokeRole(tenant, member.id, id));

  // A role already running is left out of the list; an ended one can be given again.
  const options = useMemo<ComboboxOption[]>(() => {
    const running = new Set(member.roles.filter((r) => !r.expired).map((r) => r.role_id));
    return roles
      .filter((r) => !running.has(r.id))
      .map((r) => ({ value: r.id, label: r.name, description: r.description ?? undefined }));
  }, [roles, member.roles]);

  const add = () =>
    grant.mutate(undefined, {
      onSuccess: () => {
        toast.success(t("rbac.member.added"));
        setRoleId("");
        setUntil("");
      },
      onError: (e) => toast.error(apiErrorText(e, t("rbac.member.addFailed"))),
    });

  const removeRole = (role: HeldRole) =>
    remove.mutate(role.role_id, {
      onSuccess: () => toast.success(t("rbac.member.removed")),
      onError: (e) => toast.error(apiErrorText(e, t("rbac.member.removeFailed"))),
    });

  return (
    <FormSheet
      open
      onOpenChange={(open) => !open && onClose()}
      title={t("rbac.member.title")}
      description={member.email}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t("common.close")}
          </Button>
          {canManage && (
            <Button disabled={!roleId || grant.isPending} onClick={add}>
              {grant.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("rbac.member.add")}
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-5">
        {member.roles.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("rbac.member.none")}</p>
        ) : (
          <ul className="space-y-2">
            {member.roles.map((r) => (
              <HeldRow
                key={r.assignment_id}
                role={r}
                busy={remove.isPending}
                canManage={canManage}
                onRemove={() => removeRole(r)}
              />
            ))}
          </ul>
        )}

        {canManage && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("rbac.member.addRole")}>
              <SearchableCombobox
                options={options}
                value={roleId}
                onChange={(v) => setRoleId(v)}
                placeholder={t("rbac.member.choose")}
              />
            </Field>
            <Field label={t("rbac.member.endDate")} htmlFor="role-until" hint={t("rbac.member.endDateHint")}>
              <Input
                id="role-until"
                type="date"
                min={now ? new Date(now).toISOString().slice(0, 10) : undefined}
                value={until}
                onChange={(e) => setUntil(e.target.value)}
              />
            </Field>
          </div>
        )}
      </div>
    </FormSheet>
  );
}
