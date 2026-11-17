"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, CardContent } from "@/components/ui/base";
import { usePermissionCatalogue, useRbacMutation, useRolePermissionCodes } from "@/hooks/useRbac";
import { useT } from "@/hooks/useT";
import { apiErrorText, setRolePermissions, type Permission, type Role } from "@/lib/api/rbac";

function moduleTitle(module: string): string {
  return module.charAt(0).toUpperCase() + module.slice(1).replace(/_/g, " ");
}

function sameSet(a: Set<string>, b: Set<string>): boolean {
  return a.size === b.size && [...a].every((code) => b.has(code));
}

/** Rendered only once the role's real permissions are known, so a save can never start from empty. */
function EditorForm({
  tenant,
  role,
  catalogue,
  current,
  canManage,
  actions,
  onSaved,
}: {
  tenant: string;
  role: Role;
  catalogue: Permission[];
  current: string[];
  canManage: boolean;
  actions?: React.ReactNode;
  onSaved: (role: Role) => void;
}) {
  const { t } = useT();
  const saved = useMemo(() => new Set(current), [current]);
  const [selected, setSelected] = useState(saved);
  const save = useRbacMutation(tenant, () => setRolePermissions(tenant, role.id, [...selected]));

  const modules = useMemo(() => {
    const grouped = new Map<string, Permission[]>();
    for (const perm of catalogue) grouped.set(perm.module, [...(grouped.get(perm.module) ?? []), perm]);
    return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [catalogue]);

  const toggle = (code: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (!next.delete(code)) next.add(code);
      return next;
    });

  const setAll = (perms: Permission[], on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const perm of perms) {
        if (on) next.add(perm.permission_code);
        else next.delete(perm.permission_code);
      }
      return next;
    });

  const submit = () =>
    save.mutate(undefined, {
      // Saving a default role answers with this tenant's own copy, which has a new id.
      onSuccess: (updated) => {
        toast.success(t("rbac.editor.saved"));
        if (updated) onSaved(updated);
      },
      onError: (e) => toast.error(apiErrorText(e, t("rbac.editor.saveFailed"))),
    });

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="break-words text-lg font-semibold">{role.name}</h2>
            {role.description && <p className="text-sm text-muted-foreground">{role.description}</p>}
            <p className="mt-1 text-xs text-muted-foreground">
              {t("rbac.editor.granted", { count: selected.size, total: catalogue.length })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">
            {actions}
            {canManage && (
              <Button disabled={save.isPending || sameSet(selected, saved)} onClick={submit}>
                {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("rbac.editor.save")}
              </Button>
            )}
          </div>
        </div>

        {!canManage && <p className="text-sm text-muted-foreground">{t("rbac.roles.readOnly")}</p>}

        <div className="grid gap-3 md:grid-cols-2">
          {modules.map(([module, perms]) => {
            const allOn = perms.every((p) => selected.has(p.permission_code));
            return (
              <fieldset key={module} disabled={!canManage} className="min-w-0 rounded-lg border border-border p-3">
                <legend className="px-1 text-sm font-semibold">{moduleTitle(module)}</legend>
                {canManage && (
                  <button
                    type="button"
                    className="mb-1 text-xs text-primary underline"
                    onClick={() => setAll(perms, !allOn)}
                  >
                    {allOn ? t("rbac.editor.clearAll") : t("rbac.editor.selectAll")}
                  </button>
                )}
                {perms.map((perm) => (
                  <label key={perm.id} className="flex min-h-9 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 shrink-0 accent-primary"
                      checked={selected.has(perm.permission_code)}
                      onChange={() => toggle(perm.permission_code)}
                    />
                    <span className="min-w-0 break-words">{perm.name}</span>
                  </label>
                ))}
              </fieldset>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/** The permission matrix of one role, grouped by module. */
export function PermissionEditor({
  tenant,
  role,
  canManage,
  actions,
  onSaved,
}: {
  tenant: string;
  role: Role;
  canManage: boolean;
  actions?: React.ReactNode;
  onSaved: (role: Role) => void;
}) {
  const { t } = useT();
  const catalogue = usePermissionCatalogue(tenant);
  const current = useRolePermissionCodes(tenant, role.id);

  if (catalogue.error || current.error) {
    return <p className="py-8 text-center text-sm text-destructive">{t("rbac.editor.loadFailed")}</p>;
  }
  if (!catalogue.data || !current.data) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-primary" aria-label={t("rbac.editor.loading")} />
      </div>
    );
  }
  return (
    <EditorForm
      tenant={tenant}
      role={role}
      catalogue={catalogue.data}
      current={current.data}
      canManage={canManage}
      actions={actions}
      onSaved={onSaved}
    />
  );
}
