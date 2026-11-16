"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { PlusCircle, Route } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@bengo-hub/shared-ui-lib/data-table";
import { useDeleteRoutingRule, useRoutingRules } from "@/hooks/useRouting";
import { useLookups } from "@/hooks/useLookups";
import { useServicePermissions } from "@/hooks/useServicePermissions";
import { PERM } from "@/lib/rbac/permissions";
import { PageHeader } from "@/components/common/page-header";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/base";
import { orgRoute } from "@/lib/utils";
import type { RoutingRule } from "@/types/routing";
import { buildRoutingColumns } from "./routing-columns";
import { RuleSheet } from "./rule-sheet";

export default function RoutingRulesPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const { can } = useServicePermissions(orgSlug);
  const canManage = can(PERM.routingManage);
  const { agentName, teamName, categoryName, agentOptions, teamOptions, categoryOptions } = useLookups(orgSlug);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const { data, isLoading, isError, refetch } = useRoutingRules(orgSlug, page, limit);
  const deleteRule = useDeleteRoutingRule(orgSlug);

  const [editing, setEditing] = useState<RoutingRule | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [removing, setRemoving] = useState<RoutingRule | null>(null);
  const openSheet = (r: RoutingRule | null) => {
    setEditing(r);
    setSheetOpen(true);
  };

  const columns = useMemo(
    () =>
      buildRoutingColumns({
        lookups: { agentName, teamName, categoryName },
        canManage,
        onEdit: (r) => {
          setEditing(r);
          setSheetOpen(true);
        },
        onDelete: setRemoving,
      }),
    [agentName, teamName, categoryName, canManage],
  );
  const total = data?.total ?? 0;

  const onRemove = async () => {
    if (!removing) return;
    try {
      await deleteRule.mutateAsync(removing.id);
      toast.success("Rule deleted");
      setRemoving(null);
    } catch {
      toast.error("The rule could not be deleted.");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeader
        back={{ href: orgRoute(orgSlug, "/admin"), label: "Admin" }}
        icon={Route}
        title="Routing rules"
        subtitle="Send new tickets to the right team or agent, or raise their priority, from what they contain."
        actions={
          canManage ? (
            <Button onClick={() => openSheet(null)}>
              <PlusCircle className="h-4 w-4" /> New rule
            </Button>
          ) : undefined
        }
      />

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(r) => r.id}
        defaultSort={{ key: "sort_order", dir: "asc" }}
        loading={isLoading}
        loadingRows={4}
        error={isError}
        onRetry={() => void refetch()}
        emptyText="No routing rules yet."
        onRowClick={canManage ? openSheet : undefined}
        maxBodyHeight={false}
        page={page}
        totalPages={Math.max(1, Math.ceil(total / limit))}
        onPageChange={setPage}
        total={total}
        pageSize={limit}
        pageSizeOptions={[10, 25, 50, 100]}
        onPageSizeChange={(n) => {
          setLimit(n);
          setPage(1);
        }}
      />

      {sheetOpen && (
        <RuleSheet
          key={editing?.id ?? "new"}
          orgSlug={orgSlug}
          rule={editing}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          categoryOptions={categoryOptions}
          teamOptions={teamOptions}
          agentOptions={agentOptions}
        />
      )}

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={`Delete ${removing?.name ?? "rule"}?`}
        description="Tickets already routed by this rule keep their assignment."
        confirmLabel="Delete rule"
        loading={deleteRule.isPending}
        onConfirm={() => void onRemove()}
      />
    </div>
  );
}
