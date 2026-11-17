"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Copy, Loader2, Pencil, Plus, ShieldCheck, Trash2, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { PageHeader } from "@/components/common/page-header";
import { Badge, Button, Card, CardContent } from "@/components/ui/base";
import { useRbacMutation, useRoles } from "@/hooks/useRbac";
import { useServicePermissions } from "@/hooks/useServicePermissions";
import { useT } from "@/hooks/useT";
import { apiErrorText, customizeRole, deleteRole, type Role } from "@/lib/api/rbac";
import type { MessageKey } from "@/lib/i18n";
import { PERM } from "@/lib/rbac/permissions";
import { cn, orgRoute } from "@/lib/utils";
import { PermissionEditor } from "./_components/permission-editor";
import { RoleChanges } from "./_components/role-changes";
import { RoleFormSheet, type RoleFormMode } from "./_components/role-form-sheet";

function kindKey(role: Role): MessageKey {
  if (role.is_customized) return "rbac.roles.kindCustomized";
  return role.scope === "global" || role.is_system_role ? "rbac.roles.kindDefault" : "rbac.roles.kindOwn";
}

/** One of the tenant's own roles, which may be renamed and deleted. */
const ownRole = (r: Role) => r.scope === "tenant" && !r.is_system_role;
/** A shared default role the tenant has not yet made its own copy of. */
const customizable = (r: Role) => r.scope === "global" && !r.is_customized;

/** System and custom roles with their permission matrix and the change history (treasury-ui's Roles screen). */
export default function RolesPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const { t } = useT();
  const { can } = useServicePermissions(orgSlug);
  const canManage = can(PERM.rbacManage);
  const { data: roles = [], isLoading, isError, refetch } = useRoles(orgSlug);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [form, setForm] = useState<RoleFormMode | null>(null);
  const [deleting, setDeleting] = useState<Role | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const remove = useRbacMutation(orgSlug, (id: string) => deleteRole(orgSlug, id));
  const customize = useRbacMutation(orgSlug, (code: string) => customizeRole(orgSlug, code));

  // Selection follows the code: saving or customising a default role gives it a new id.
  const selected = roles.find((r) => r.role_code === selectedCode) ?? roles[0] ?? null;

  // On a phone the editor sits below the list, so opening a role brings it into view.
  const openRole = (role: Role) => {
    setSelectedCode(role.role_code);
    if (window.matchMedia("(max-width: 1023px)").matches) {
      requestAnimationFrame(() => editorRef.current?.scrollIntoView({ block: "start", behavior: "smooth" }));
    }
  };

  const confirmDelete = () => {
    if (!deleting) return;
    remove.mutate(deleting.id, {
      onSuccess: () => {
        toast.success(t("rbac.roles.deleted"));
        setDeleting(null);
        setSelectedCode(null);
      },
      onError: (e) => toast.error(apiErrorText(e, t("rbac.roles.deleteFailed"))),
    });
  };

  const makeOwnCopy = (role: Role) =>
    customize.mutate(role.role_code, {
      onSuccess: (copy) => {
        toast.success(t("rbac.roles.customized"));
        if (copy) setSelectedCode(copy.role_code);
      },
      onError: (e) => toast.error(apiErrorText(e, t("rbac.roles.customizeFailed"))),
    });

  const editorActions =
    selected && canManage ? (
      <>
        {customizable(selected) && (
          <Button
            variant="outline"
            title={t("rbac.roles.customizeHint")}
            disabled={customize.isPending}
            onClick={() => makeOwnCopy(selected)}
          >
            {customize.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
            {t("rbac.roles.customize")}
          </Button>
        )}
        {ownRole(selected) && (
          <Button variant="outline" onClick={() => setForm({ kind: "edit", role: selected })}>
            <Pencil className="h-4 w-4" /> {t("rbac.roles.editDetails")}
          </Button>
        )}
      </>
    ) : null;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeader
        back={{ href: orgRoute(orgSlug, "/admin"), label: t("nav.admin") }}
        icon={ShieldCheck}
        title={t("rbac.roles.title")}
        subtitle={
          <>
            {t("rbac.roles.subtitle")}{" "}
            <Link className="text-primary underline" href={orgRoute(orgSlug, "/admin/settings/team")}>
              {t("rbac.roles.backToTeam")}
            </Link>
          </>
        }
        actions={
          canManage ? (
            <Button onClick={() => setForm({ kind: "create" })}>
              <Plus className="h-4 w-4" /> {t("rbac.roles.new")}
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-primary" aria-label={t("common.loading")} />
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-3 p-6">
            <p className="text-sm text-destructive">{t("rbac.roles.loadFailed")}</p>
            <Button variant="outline" onClick={() => void refetch()}>
              {t("common.retry")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <Card className="self-start">
            <CardContent className="p-2">
              <ul className="space-y-1">
                {roles.map((role) => {
                  const active = selected?.id === role.id;
                  return (
                    <li key={role.id} className={cn("flex items-center gap-1 rounded-lg", active && "bg-primary/10")}>
                      <button
                        type="button"
                        aria-current={active}
                        className="min-w-0 flex-1 rounded-lg p-2 text-left"
                        onClick={() => openRole(role)}
                      >
                        <span className="block truncate text-sm font-medium">{role.name}</span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          <Badge variant={role.is_customized ? "secondary" : "outline"}>{t(kindKey(role))}</Badge>
                          {t("rbac.roles.people", { count: role.member_count ?? 0 })}
                        </span>
                      </button>
                      {canManage && (
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={t("rbac.roles.copy", { name: role.name })}
                          onClick={() => setForm({ kind: "copy", source: role })}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                      {canManage && ownRole(role) && (
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={t("rbac.roles.delete", { name: role.name })}
                          onClick={() => setDeleting(role)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          <div ref={editorRef} className="min-w-0 scroll-mt-20">
            {selected && (
              <PermissionEditor
                key={selected.id}
                tenant={orgSlug}
                role={selected}
                canManage={canManage}
                actions={editorActions}
                onSaved={(role) => setSelectedCode(role.role_code)}
              />
            )}
          </div>
        </div>
      )}

      <RoleChanges tenant={orgSlug} />

      {form && (
        <RoleFormSheet
          key={form.kind === "edit" ? form.role.id : form.kind === "copy" ? `copy-${form.source.id}` : "new"}
          tenant={orgSlug}
          mode={form}
          onClose={() => setForm(null)}
          onSaved={(role) => setSelectedCode(role.role_code)}
        />
      )}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("rbac.roles.deleteTitle", { name: deleting?.name ?? "" })}
        description={t("rbac.roles.deleteBody")}
        confirmLabel={t("rbac.roles.deleteConfirm")}
        loading={remove.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
