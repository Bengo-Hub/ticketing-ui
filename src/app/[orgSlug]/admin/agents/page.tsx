"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useAgents, useCreateAgent, useDeleteAgent } from "@/hooks/useAgents";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@/components/ui/base";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, PlusCircle, Shield, Trash2 } from "lucide-react";
import Link from "next/link";
import { orgRoute } from "@/lib/utils";

const schema = z.object({
  full_name: z.string().min(2, "Name required"),
  email: z.string().email("Valid email required"),
  user_id: z.string().min(1, "User ID required"),
  role: z.enum(["agent", "supervisor", "admin"]),
});

type FormData = z.infer<typeof schema>;

export default function AgentsPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useAgents(orgSlug);
  const agents = data?.data ?? [];
  const createAgent = useCreateAgent(orgSlug);
  const deleteAgent = useDeleteAgent(orgSlug);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { role: "agent" } });

  const onSubmit = async (data: FormData) => {
    try {
      await createAgent.mutateAsync({
        full_name: data.full_name,
        email: data.email,
        user_id: data.user_id,
        role: data.role,
      });
      toast.success("Agent added");
      reset();
      setShowForm(false);
    } catch {
      toast.error("Failed to add agent.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove agent "${name}"?`)) return;
    try {
      await deleteAgent.mutateAsync(id);
      toast.success("Agent removed");
    } catch {
      toast.error("Failed to remove agent.");
    }
  };

  const roleColors: Record<string, string> = {
    agent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    supervisor: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    admin: "bg-primary/10 text-primary",
  };

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    inactive: "bg-gray-100 text-gray-500",
    busy: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
            <Shield className="h-6 w-6 text-primary" />
            Agents
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{agents.length} agents</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          {showForm ? "Cancel" : "Add Agent"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Add Agent</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input id="full_name" placeholder="John Doe" {...register("full_name")} />
                  {errors.full_name && (
                    <p className="text-xs text-destructive">{errors.full_name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" placeholder="john@example.com" {...register("email")} />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user_id">User ID *</Label>
                  <Input id="user_id" placeholder="SSO user ID" {...register("user_id")} />
                  {errors.user_id && (
                    <p className="text-xs text-destructive">{errors.user_id.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    {...register("role")}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="agent">Agent</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { reset(); setShowForm(false); }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || createAgent.isPending}>
                  {(isSubmitting || createAgent.isPending) && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Add Agent
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
          ) : agents.length === 0 ? (
            <div className="p-8 text-center">
              <Shield className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No agents yet. Add your first agent.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {agents.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {agent.full_name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{agent.full_name}</p>
                      <p className="text-xs text-muted-foreground">{agent.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${roleColors[agent.role] ?? ""}`}>
                      {agent.role}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusColors[agent.status] ?? ""}`}>
                      {agent.status}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => void handleDelete(agent.id, agent.full_name)}
                      title="Remove agent"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
