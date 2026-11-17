"use client";

import { DataTable, type DataTableColumn } from "@bengo-hub/shared-ui-lib/data-table";
import { Card, CardContent } from "@/components/ui/base";
import { useRoleChanges } from "@/hooks/useRbac";
import { useT } from "@/hooks/useT";
import type { RoleChange } from "@/lib/api/rbac";
import type { MessageKey } from "@/lib/i18n";
import { formatDateTime } from "@/lib/utils";

const ACTION_KEYS: Record<string, MessageKey> = {
  "role.created": "rbac.changes.roleCreated",
  "role.cloned": "rbac.changes.roleCloned",
  "role.customized": "rbac.changes.roleCustomized",
  "role.updated": "rbac.changes.roleUpdated",
  "role.deleted": "rbac.changes.roleDeleted",
  "role.permissions_updated": "rbac.changes.permissionsUpdated",
  "role.assigned": "rbac.changes.roleAssigned",
  "role.revoked": "rbac.changes.roleRevoked",
  create: "rbac.changes.personAdded",
};

/** The name of what changed, read from the entry's own details. */
function subject(change: RoleChange): string {
  if (!change.changes) return "";
  try {
    const details = JSON.parse(change.changes) as { name?: string; role_code?: string; email?: string };
    return details.name ?? details.role_code ?? details.email ?? "";
  } catch {
    return "";
  }
}

/** The tenant's role and people audit log (`GET /rbac/audit-logs`). */
export function RoleChanges({ tenant }: { tenant: string }) {
  const { t } = useT();
  const { data = [], isLoading, isError, refetch } = useRoleChanges(tenant);

  const columns: DataTableColumn<RoleChange>[] = [
    {
      key: "action",
      header: t("rbac.changes.colChange"),
      primary: true,
      filterable: true,
      accessor: (c) => (ACTION_KEYS[c.action] ? t(ACTION_KEYS[c.action]) : c.action),
    },
    { key: "subject", header: t("rbac.changes.colSubject"), accessor: subject },
    { key: "by", header: t("rbac.changes.colBy"), sortable: true, accessor: (c) => c.user_email },
    {
      key: "when",
      header: t("rbac.changes.colWhen"),
      align: "right",
      sortable: true,
      accessor: (c) => c.created_at,
      render: (c) => formatDateTime(c.created_at),
    },
  ];

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div>
          <h2 className="text-lg font-semibold">{t("rbac.changes.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("rbac.changes.hint")}</p>
        </div>
        <DataTable
          columns={columns}
          rows={data}
          rowKey={(c) => c.id}
          loading={isLoading}
          loadingRows={3}
          error={isError}
          onRetry={() => void refetch()}
          emptyText={t("rbac.changes.empty")}
          storageKey="ticketing.rbac.changes.columns"
          maxBodyHeight={false}
        />
      </CardContent>
    </Card>
  );
}
