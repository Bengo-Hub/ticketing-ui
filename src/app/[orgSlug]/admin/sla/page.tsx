"use client";

import { useCallback, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { PlusCircle, Timer } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@bengo-hub/shared-ui-lib/data-table";
import { SearchableCombobox } from "@bengo-hub/shared-ui-lib/combobox";
import { useCalendars, useDeleteSLAPolicy, useSLAPolicies } from "@/hooks/useSLA";
import { useLookups } from "@/hooks/useLookups";
import { useServicePermissions } from "@/hooks/useServicePermissions";
import { useT } from "@/hooks/useT";
import { PERM } from "@/lib/rbac/permissions";
import { useTicketLabels } from "@/lib/ticket-options";
import { PageHeader } from "@/components/common/page-header";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/base";
import { orgRoute } from "@/lib/utils";
import type { TicketPriority } from "@/types/tickets";
import type { SLAPolicy } from "@/types/sla";
import { buildSLAColumns } from "./sla-columns";
import { SLASheet } from "./sla-sheet";
import { SLATabs } from "./sla-tabs";

export default function SLAPoliciesPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const { t } = useT();
  const { can } = useServicePermissions(orgSlug);
  const canAdd = can(PERM.slaAdd);
  const canChange = can(PERM.slaChange);
  const canDelete = can(PERM.slaDelete);
  const { categoryName, categoryOptions, teamOptions } = useLookups(orgSlug);
  const labels = useTicketLabels();
  const calendars = useCalendars(orgSlug);
  const calendarRows = calendars.data?.data;

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

  const calendarName = useCallback(
    (id: string | null) =>
      id ? (calendarRows?.find((c) => c.id === id)?.name ?? t("slaPolicies.calendarMissing")) : t("slaPolicies.clock24x7"),
    [calendarRows, t],
  );
  const activeOptions = useMemo(
    () => [
      { value: "true", label: t("slaPolicies.active") },
      { value: "false", label: t("slaPolicies.inactive") },
    ],
    [t],
  );

  const columns = useMemo(
    () =>
      buildSLAColumns({
        t,
        categoryName,
        calendarName,
        canChange,
        canDelete,
        onEdit: (p) => {
          setEditing(p);
          setSheetOpen(true);
        },
        onDelete: setRemoving,
      }),
    [t, categoryName, calendarName, canChange, canDelete],
  );
  const total = data?.total ?? 0;

  const onRemove = async () => {
    if (!removing) return;
    try {
      await deletePolicy.mutateAsync(removing.id);
      toast.success(t("slaPolicies.deleted"));
      setRemoving(null);
    } catch {
      toast.error(t("slaPolicies.deleteFailed"));
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeader
        back={{ href: orgRoute(orgSlug, "/admin"), label: t("nav.admin") }}
        icon={Timer}
        title={t("slaPolicies.title")}
        subtitle={t("slaPolicies.subtitle")}
        actions={
          canAdd ? (
            <Button onClick={() => openSheet(null)}>
              <PlusCircle className="h-4 w-4" /> {t("slaPolicies.new")}
            </Button>
          ) : undefined
        }
      />
      <SLATabs orgSlug={orgSlug} />

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(p) => p.id}
        loading={isLoading}
        loadingRows={4}
        error={isError}
        onRetry={() => void refetch()}
        emptyText={priority || active ? t("slaPolicies.emptyFiltered") : t("slaPolicies.empty")}
        onRowClick={canChange ? openSheet : undefined}
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
          <div className="grid w-full grid-cols-1 gap-2 min-[400px]:grid-cols-2 sm:max-w-md">
            <SearchableCombobox
              options={labels.priorityOptions}
              value={priority}
              onChange={(v) => {
                setPriority(v as TicketPriority | "");
                setPage(1);
              }}
              placeholder={t("slaPolicies.allPriorities")}
            />
            <SearchableCombobox
              options={activeOptions}
              value={active}
              onChange={(v) => {
                setActive(v);
                setPage(1);
              }}
              placeholder={t("slaPolicies.anyState")}
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
          teamOptions={teamOptions}
          calendars={calendarRows ?? []}
        />
      )}

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={t("slaPolicies.deleteTitle", { name: removing?.name ?? "" })}
        description={t("slaPolicies.deleteBody")}
        confirmLabel={t("slaPolicies.deleteConfirm")}
        loading={deletePolicy.isPending}
        onConfirm={() => void onRemove()}
      />
    </div>
  );
}
