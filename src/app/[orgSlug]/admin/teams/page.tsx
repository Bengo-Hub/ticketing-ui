"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, PlusCircle, Users } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@bengo-hub/shared-ui-lib/data-table";
import { useCreateTeam, useDeleteTeam, useTeams, useUpdateTeam } from "@/hooks/useAgents";
import { useServicePermissions } from "@/hooks/useServicePermissions";
import { PERM } from "@/lib/rbac/permissions";
import { PageHeader } from "@/components/common/page-header";
import { FormSheet } from "@/components/common/form-sheet";
import { Field, SwitchField } from "@/components/common/field";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button, Input } from "@/components/ui/base";
import { orgRoute } from "@/lib/utils";
import type { Team } from "@/types/agents";
import { buildTeamColumns } from "./teams-columns";

function TeamSheet({
  orgSlug,
  team,
  open,
  onOpenChange,
}: {
  orgSlug: string;
  team: Team | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState(team?.name ?? "");
  const [description, setDescription] = useState(team?.description ?? "");
  const [active, setActive] = useState(team?.is_active ?? true);
  const [error, setError] = useState<string | null>(null);
  const create = useCreateTeam(orgSlug);
  const update = useUpdateTeam(orgSlug);
  const pending = create.isPending || update.isPending;

  const save = async () => {
    setError(null);
    if (name.trim().length < 2) return setError("The team name needs at least 2 characters.");
    try {
      if (team) {
        await update.mutateAsync({
          id: team.id,
          data: { name: name.trim(), description: description.trim(), is_active: active },
        });
        toast.success("Team updated");
      } else {
        await create.mutateAsync({ name: name.trim(), description: description.trim() || undefined });
        toast.success("Team created");
      }
      onOpenChange(false);
    } catch {
      setError("The team could not be saved.");
    }
  };

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      title={team ? `Edit ${team.name}` : "New team"}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {team ? "Save changes" : "Create team"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Name" htmlFor="team-name" required>
          <Input id="team-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Technical support" />
        </Field>
        <Field label="Description" htmlFor="team-desc" hint="One line on what the team handles.">
          <Input id="team-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        {team && (
          <SwitchField
            label="Active"
            description="Inactive teams are hidden from assignment pickers."
            checked={active}
            onChange={setActive}
          />
        )}
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    </FormSheet>
  );
}

export default function TeamsPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const { can } = useServicePermissions(orgSlug);
  const canManage = can(PERM.teamsManage);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const { data, isLoading, isError, refetch } = useTeams(orgSlug, { page, limit });
  const deleteTeam = useDeleteTeam(orgSlug);

  const [editing, setEditing] = useState<Team | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [removing, setRemoving] = useState<Team | null>(null);

  const columns = useMemo(
    () =>
      buildTeamColumns({
        canManage,
        onEdit: (t) => {
          setEditing(t);
          setSheetOpen(true);
        },
        onDelete: setRemoving,
      }),
    [canManage],
  );
  const total = data?.total ?? 0;

  const onRemove = async () => {
    if (!removing) return;
    try {
      await deleteTeam.mutateAsync(removing.id);
      toast.success("Team deleted");
      setRemoving(null);
    } catch {
      toast.error("The team could not be deleted.");
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <PageHeader
        back={{ href: orgRoute(orgSlug, "/admin"), label: "Admin" }}
        icon={Users}
        title="Teams"
        subtitle={`${total} teams`}
        actions={
          canManage ? (
            <Button
              onClick={() => {
                setEditing(null);
                setSheetOpen(true);
              }}
            >
              <PlusCircle className="h-4 w-4" /> New team
            </Button>
          ) : undefined
        }
      />

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(t) => t.id}
        loading={isLoading}
        loadingRows={4}
        error={isError}
        onRetry={() => void refetch()}
        emptyText="No teams yet."
        onRowClick={
          canManage
            ? (t) => {
                setEditing(t);
                setSheetOpen(true);
              }
            : undefined
        }
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
        <TeamSheet key={editing?.id ?? "new"} orgSlug={orgSlug} team={editing} open={sheetOpen} onOpenChange={setSheetOpen} />
      )}

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={`Delete ${removing?.name ?? "team"}?`}
        description="Move the team's agents and open tickets to another team first. This cannot be undone."
        confirmLabel="Delete team"
        loading={deleteTeam.isPending}
        onConfirm={() => void onRemove()}
      />
    </div>
  );
}
