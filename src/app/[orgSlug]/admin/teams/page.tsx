"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTeams, useCreateTeam, useDeleteTeam } from "@/hooks/useAgents";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
} from "@/components/ui/base";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, PlusCircle, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { orgRoute } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function TeamsPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useTeams(orgSlug);
  const teams = data?.data ?? [];
  const createTeam = useCreateTeam(orgSlug);
  const deleteTeam = useDeleteTeam(orgSlug);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await createTeam.mutateAsync({ name: data.name, description: data.description });
      toast.success("Team created");
      reset();
      setShowForm(false);
    } catch {
      toast.error("Failed to create team.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete team "${name}"?`)) return;
    try {
      await deleteTeam.mutateAsync(id);
      toast.success("Team deleted");
    } catch {
      toast.error("Failed to delete team.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={orgRoute(orgSlug, "/admin")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <Users className="h-6 w-6 text-primary" />
            Teams
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{teams.length} teams</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          {showForm ? "Cancel" : "New Team"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Create Team</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Team Name *</Label>
                <Input id="name" placeholder="e.g. Technical Support" {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Optional description..."
                  rows={2}
                  {...register("description")}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { reset(); setShowForm(false); }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || createTeam.isPending}>
                  {(isSubmitting || createTeam.isPending) && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Create Team
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : teams.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No teams yet. Create your first team.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {teams.map((team) => (
                <div key={team.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold text-foreground">{team.name}</p>
                    {team.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">{team.description}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => void handleDelete(team.id, team.name)}
                    title="Delete team"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
