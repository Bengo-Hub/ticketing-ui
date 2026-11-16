"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { CalendarClock, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@bengo-hub/shared-ui-lib/data-table";
import { useCalendars, useDeleteCalendar } from "@/hooks/useSLA";
import { useServicePermissions } from "@/hooks/useServicePermissions";
import { useT } from "@/hooks/useT";
import { PERM } from "@/lib/rbac/permissions";
import { PageHeader } from "@/components/common/page-header";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/base";
import { orgRoute } from "@/lib/utils";
import type { BusinessCalendar } from "@/types/sla";
import { SLATabs } from "../sla-tabs";
import { buildCalendarColumns } from "./calendar-columns";
import { CalendarSheet } from "./calendar-sheet";

export default function SLACalendarsPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const { t } = useT();
  const { can } = useServicePermissions(orgSlug);
  const canAdd = can(PERM.slaAdd);
  const canChange = can(PERM.slaChange);
  const canDelete = can(PERM.slaDelete);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const { data, isLoading, isError, refetch } = useCalendars(orgSlug, page, limit);
  const remove = useDeleteCalendar(orgSlug);

  const [editing, setEditing] = useState<BusinessCalendar | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [removing, setRemoving] = useState<BusinessCalendar | null>(null);
  const openSheet = (c: BusinessCalendar | null) => {
    setEditing(c);
    setSheetOpen(true);
  };

  const columns = useMemo(
    () =>
      buildCalendarColumns({
        t,
        canChange,
        canDelete,
        onEdit: (c) => {
          setEditing(c);
          setSheetOpen(true);
        },
        onDelete: setRemoving,
      }),
    [t, canChange, canDelete],
  );
  const total = data?.total ?? 0;

  const onRemove = async () => {
    if (!removing) return;
    try {
      await remove.mutateAsync(removing.id);
      toast.success(t("slaCalendars.deleted"));
      setRemoving(null);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      toast.error(status === 409 ? t("slaCalendars.inUse") : t("slaCalendars.deleteFailed"));
      setRemoving(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeader
        back={{ href: orgRoute(orgSlug, "/admin"), label: t("nav.admin") }}
        icon={CalendarClock}
        title={t("slaCalendars.title")}
        subtitle={t("slaCalendars.subtitle")}
        actions={
          canAdd ? (
            <Button onClick={() => openSheet(null)}>
              <PlusCircle className="h-4 w-4" /> {t("slaCalendars.new")}
            </Button>
          ) : undefined
        }
      />
      <SLATabs orgSlug={orgSlug} />

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(c) => c.id}
        loading={isLoading}
        loadingRows={3}
        error={isError}
        onRetry={() => void refetch()}
        emptyText={t("slaCalendars.empty")}
        onRowClick={canChange ? openSheet : undefined}
        maxBodyHeight={false}
        page={page}
        totalPages={Math.max(1, Math.ceil(total / limit))}
        onPageChange={setPage}
        total={total}
        pageSize={limit}
        pageSizeOptions={[10, 25, 50]}
        onPageSizeChange={(n) => {
          setLimit(n);
          setPage(1);
        }}
      />

      {sheetOpen && (
        <CalendarSheet
          key={editing?.id ?? "new"}
          orgSlug={orgSlug}
          calendar={editing}
          isFirst={!isLoading && total === 0}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
      )}

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={t("slaCalendars.deleteTitle", { name: removing?.name ?? "" })}
        description={t("slaCalendars.deleteBody")}
        confirmLabel={t("slaCalendars.deleteConfirm")}
        loading={remove.isPending}
        onConfirm={() => void onRemove()}
      />
    </div>
  );
}
