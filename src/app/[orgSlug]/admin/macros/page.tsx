"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { PlusCircle, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@bengo-hub/shared-ui-lib/data-table";
import { PageHeader } from "@/components/common/page-header";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/base";
import { useDeleteMacro, useMacros } from "@/hooks/useMacros";
import { useServicePermissions } from "@/hooks/useServicePermissions";
import { useT } from "@/hooks/useT";
import { PERM } from "@/lib/rbac/permissions";
import { useTicketLabels } from "@/lib/ticket-options";
import { orgRoute } from "@/lib/utils";
import type { Macro } from "@/types/workspace";
import { buildMacroColumns } from "./macro-columns";
import { MacroSheet } from "./macro-sheet";

/**
 * Macros: canned replies with field changes that agents apply from the composer. They are
 * curated content, so they are managed with knowledge base permission, as on the API.
 */
export default function MacrosPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const { t } = useT();
  const labels = useTicketLabels();
  const { can } = useServicePermissions(orgSlug);
  const canManage = can(PERM.kbManage);
  const { data = [], isLoading, isError, refetch } = useMacros(orgSlug, false, canManage);
  const remove = useDeleteMacro(orgSlug);
  const [editing, setEditing] = useState<Macro | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [removing, setRemoving] = useState<Macro | null>(null);

  const openSheet = (m: Macro | null) => {
    setEditing(m);
    setSheetOpen(true);
  };

  const columns = useMemo(
    () =>
      buildMacroColumns({
        labels,
        t,
        onEdit: (m) => {
          setEditing(m);
          setSheetOpen(true);
        },
        onDelete: setRemoving,
      }),
    [labels, t],
  );

  const onRemove = async () => {
    if (!removing) return;
    try {
      await remove.mutateAsync(removing.id);
      toast.success(t("macros.deleted"));
      setRemoving(null);
    } catch {
      toast.error(t("macros.deleteFailed"));
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeader
        back={{ href: orgRoute(orgSlug, "/admin"), label: t("nav.admin") }}
        icon={WandSparkles}
        title={t("macros.title")}
        subtitle={t("macros.subtitle")}
        actions={
          canManage ? (
            <Button onClick={() => openSheet(null)}>
              <PlusCircle className="h-4 w-4" /> {t("macros.new")}
            </Button>
          ) : undefined
        }
      />

      <DataTable
        columns={columns}
        rows={data}
        rowKey={(m) => m.id}
        loading={isLoading}
        loadingRows={4}
        error={isError}
        onRetry={() => void refetch()}
        emptyText={t("macros.empty")}
        onRowClick={openSheet}
        maxBodyHeight={false}
      />

      {sheetOpen && (
        <MacroSheet key={editing?.id ?? "new"} orgSlug={orgSlug} macro={editing} open={sheetOpen} onOpenChange={setSheetOpen} />
      )}

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={t("macros.deleteTitle", { name: removing?.name ?? "" })}
        description={t("macros.deleteBody")}
        confirmLabel={t("macros.deleteConfirm")}
        loading={remove.isPending}
        onConfirm={() => void onRemove()}
      />
    </div>
  );
}
