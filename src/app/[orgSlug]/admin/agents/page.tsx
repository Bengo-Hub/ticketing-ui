"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Info, Shield, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@bengo-hub/shared-ui-lib/data-table";
import { useAgents, useDeleteAgent } from "@/hooks/useAgents";
import { useLookups } from "@/hooks/useLookups";
import { useServicePermissions } from "@/hooks/useServicePermissions";
import { PERM } from "@/lib/rbac/permissions";
import { PageHeader } from "@/components/common/page-header";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/base";
import { orgRoute } from "@/lib/utils";
import type { Agent } from "@/types/agents";
import { buildAgentColumns } from "./agents-columns";
import { AgentSheet } from "./agent-sheet";

export default function AgentsPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const { can, role, isPlatformOwner } = useServicePermissions(orgSlug);
  const canManage = can(PERM.agentsManage);
  // Manual add is an admin fallback; everyone else relies on agents being created at first sign-in.
  const canAddManually = canManage && (isPlatformOwner || role === "ticketing_admin");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const { data, isLoading, isError, refetch } = useAgents(orgSlug, { page, limit });
  const { teamName, teamOptions } = useLookups(orgSlug);
  const deleteAgent = useDeleteAgent(orgSlug);

  const [editing, setEditing] = useState<Agent | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [removing, setRemoving] = useState<Agent | null>(null);

  const openSheet = (agent: Agent | null) => {
    setEditing(agent);
    setSheetOpen(true);
  };

  const columns = useMemo(
    () =>
      buildAgentColumns({
        teamName,
        canManage,
        onEdit: (a) => {
          setEditing(a);
          setSheetOpen(true);
        },
        onDelete: setRemoving,
      }),
    [teamName, canManage],
  );

  const total = data?.total ?? 0;

  const onRemove = async () => {
    if (!removing) return;
    try {
      await deleteAgent.mutateAsync(removing.id);
      toast.success("Agent removed");
      setRemoving(null);
    } catch {
      toast.error("The agent could not be removed.");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeader
        back={{ href: orgRoute(orgSlug, "/admin"), label: "Admin" }}
        icon={Shield}
        title="Agents"
        subtitle={`${total} agents`}
        actions={
          canAddManually ? (
            <Button variant="outline" onClick={() => openSheet(null)}>
              <UserPlus className="h-4 w-4" /> Add manually
            </Button>
          ) : undefined
        }
      />

      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>
          Staff become agents automatically the first time they sign in to Ticketing. Set their team, role and ticket
          limit here.
        </p>
      </div>

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(a) => a.id}
        loading={isLoading}
        loadingRows={5}
        error={isError}
        onRetry={() => void refetch()}
        emptyText="No agents yet. Staff appear here after their first sign-in."
        onRowClick={canManage ? (a) => openSheet(a) : undefined}
        storageKey="ticketing.agents.columns"
        showExportCsv
        exportFileName="agents"
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
        <AgentSheet
          key={editing?.id ?? "new"}
          orgSlug={orgSlug}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          agent={editing}
          teamOptions={teamOptions}
        />
      )}

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={`Remove ${removing?.display_name ?? "agent"}?`}
        description="This removes the agent from Ticketing. Reassign their open tickets first."
        confirmLabel="Remove agent"
        loading={deleteAgent.isPending}
        onConfirm={() => void onRemove()}
      />
    </div>
  );
}
