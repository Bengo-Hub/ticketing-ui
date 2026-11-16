"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { PlusCircle, Timer } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@bengo-hub/shared-ui-lib/data-table";
import { SearchableCombobox } from "@bengo-hub/shared-ui-lib/combobox";
import { useDeleteSLAPolicy, useSLAPolicies } from "@/hooks/useSLA";
import { useLookups } from "@/hooks/useLookups";
import { useServicePermissions } from "@/hooks/useServicePermissions";
import { PERM } from "@/lib/rbac/permissions";
import { PRIORITY_OPTIONS } from "@/lib/ticket-options";
import { PageHeader } from "@/components/common/page-header";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/base";
import { orgRoute } from "@/lib/utils";
import type { TicketPriority } from "@/types/tickets";
import type { SLAPolicy } from "@/types/sla";
import { buildSLAColumns } from "./sla-columns";
import { SLASheet } from "./sla-sheet";

const ACTIVE_OPTIONS = [
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

export default function SLAPoliciesPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const { can } = useServicePermissions(orgSlug);
  const canManage = can(PERM.slaManage);
  const { categoryName, categoryOptions } = useLookups(orgSlug);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [priority, setPriority] = useState<TicketPriority | "">("");
  const [active, setActive] = useState("");
  const { data, isLoading, isError, refetch } = useSLAPolicies({
    tenantSlug: orgSlug,
    page,
    limit,
    priority: priority || undefined,
    is_active: active === "" ? undefined : active === "true",
  });
  const deletePolicy = useDeleteSLAPolicy(orgSlug);

  const [editing, setEditing] = useState<SLAPolicy | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [removing, setRemoving] = useState<SLAPolicy | null>(null);
  const openSheet = (p: SLAPolicy | null) => {
    setEditing(p);
    setSheetOpen(true);
  };

  const columns = useMemo(
    () =>
      buildSLAColumns({
        categoryName,
        canManage,
        onEdit: (p) => {
          setEditing(p);
          setSheetOpen(true);
        },
        onDelete: setRemoving,
      }),
    [categoryName, canManage],
  );
  const total = data?.total ?? 0;

  const onRemove = async () => {
    if (!removing) return;
    try {
      await deletePolicy.mutateAsync(removing.id);
      toast.success("Policy deleted");
      setRemoving(null);
    } catch {
      toast.error("The policy could not be deleted.");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeader
        back={{ href: orgRoute(orgSlug, "/admin"), label: "Admin" }}
        icon={Timer}
        title="SLA policies"
        subtitle="First response and resolution targets by priority and category."
        actions={
          canManage ? (
            <Button onClick={() => openSheet(null)}>
              <PlusCircle className="h-4 w-4" /> New policy
            </Button>
          ) : undefined
        }
      />

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(p) => p.id}
        loading={isLoading}
        loadingRows={4}
        error={isError}
        onRetry={() => void refetch()}
        emptyText={priority || active ? "No policies match these filters." : "No SLA policies yet."}
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
        toolbar={
          <div className="grid w-full grid-cols-2 gap-2 sm:max-w-md">
            <SearchableCombobox
              options={PRIORITY_OPTIONS}
              value={priority}
              onChange={(v) => {
                setPriority(v as TicketPriority | "");
                setPage(1);
              }}
              placeholder="All priorities"
            />
            <SearchableCombobox
              options={ACTIVE_OPTIONS}
              value={active}
              onChange={(v) => {
                setActive(v);
                setPage(1);
              }}
              placeholder="Any state"
            />
          </div>
        }
      />

      {sheetOpen && (
        <SLASheet
          key={editing?.id ?? "new"}
          orgSlug={orgSlug}
          policy={editing}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          categoryOptions={categoryOptions}
        />
      )}

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={`Delete ${removing?.name ?? "policy"}?`}
        description="Tickets that already have targets keep them. New tickets fall back to the next matching policy."
        confirmLabel="Delete policy"
        loading={deletePolicy.isPending}
        onConfirm={() => void onRemove()}
      />
    </div>
  );
}
