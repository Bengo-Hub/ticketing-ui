"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { UserCog, UserPlus } from "lucide-react";
import { DataTable, type DataTableColumn } from "@bengo-hub/shared-ui-lib/data-table";
import { PageHeader } from "@/components/common/page-header";
import { Badge, Button } from "@/components/ui/base";
import { useServicePermissions } from "@/hooks/useServicePermissions";
import { useTeam } from "@/hooks/useRbac";
import { useT } from "@/hooks/useT";
import type { TeamMember } from "@/lib/api/rbac";
import { PERM } from "@/lib/rbac/permissions";
import { formatDate, orgRoute } from "@/lib/utils";
import { InviteSheet } from "./_components/invite-sheet";
import { MemberRolesSheet } from "./_components/member-roles-sheet";

function RoleBadges({ member }: { member: TeamMember }) {
  const { t } = useT();
  const held = member.roles.filter((r) => !r.expired);
  if (held.length === 0) return <span className="text-xs text-muted-foreground">{t("rbac.team.noRole")}</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {held.map((r) => (
        <Badge key={r.assignment_id} variant={r.expires_at ? "warning" : "secondary"}>
          {r.expires_at ? t("rbac.team.roleUntil", { name: r.name, date: formatDate(r.expires_at) }) : r.name}
        </Badge>
      ))}
    </div>
  );
}

/** Everyone in the tenant's ticketing desk with the roles they hold (treasury-ui's Team screen). */
export default function TeamPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const { t } = useT();
  const { can } = useServicePermissions(orgSlug);
  const canManage = can(PERM.rbacManage);
  const { data: members = [], isLoading, isError, refetch } = useTeam(orgSlug);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = members.find((m) => m.id === editingId) ?? null;

  const columns: DataTableColumn<TeamMember>[] = [
    { key: "email", header: t("rbac.team.colPerson"), primary: true, sortable: true, accessor: (m) => m.email },
    {
      key: "roles",
      header: t("rbac.team.colRoles"),
      filterable: true,
      accessor: (m) =>
        m.roles
          .filter((r) => !r.expired)
          .map((r) => r.name)
          .join(", ") || t("rbac.team.noRole"),
      render: (m) => <RoleBadges member={m} />,
    },
    {
      key: "actions",
      header: t("rbac.team.colActions"),
      align: "right",
      mobileAction: true,
      exportable: false,
      accessor: () => "",
      render: (m) => (
        <Button size="sm" variant="outline" onClick={() => setEditingId(m.id)}>
          {canManage ? t("rbac.team.manage") : t("rbac.team.view")}
        </Button>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <PageHeader
        back={{ href: orgRoute(orgSlug, "/admin"), label: t("nav.admin") }}
        icon={UserCog}
        title={t("rbac.team.title")}
        subtitle={
          <>
            {t("rbac.team.subtitle")}{" "}
            <Link className="text-primary underline" href={orgRoute(orgSlug, "/admin/settings/roles")}>
              {t("rbac.team.editRoles")}
            </Link>
          </>
        }
        actions={
          canManage ? (
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus className="h-4 w-4" /> {t("rbac.team.add")}
            </Button>
          ) : undefined
        }
      />

      <DataTable
        columns={columns}
        rows={members}
        rowKey={(m) => m.id}
        loading={isLoading}
        loadingRows={5}
        error={isError}
        onRetry={() => void refetch()}
        emptyText={t("rbac.team.empty")}
        storageKey="ticketing.rbac.team.columns"
        showExportCsv
        exportFileName="users"
        maxBodyHeight={false}
      />

      {canManage && <InviteSheet tenant={orgSlug} open={inviteOpen} onOpenChange={setInviteOpen} />}
      {editing && (
        <MemberRolesSheet tenant={orgSlug} member={editing} canManage={canManage} onClose={() => setEditingId(null)} />
      )}
    </div>
  );
}
