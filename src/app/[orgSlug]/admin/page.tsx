"use client";

import { useParams, useRouter } from "next/navigation";
import { useTicketStats } from "@/hooks/useTickets";
import { useAgents, useTeams } from "@/hooks/useAgents";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
} from "@/components/ui/base";
import { orgRoute } from "@/lib/utils";
import {
  Shield,
  Users,
  BarChart3,
  Inbox,
  Clock,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

export default function AdminDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;

  const { data: stats } = useTicketStats(orgSlug);
  const { data: agentsData } = useAgents(orgSlug);
  const { data: teamsData } = useTeams(orgSlug);

  const agents = agentsData?.data ?? [];
  const teams = teamsData?.data ?? [];

  const statCards = [
    {
      label: "Total Tickets",
      value: stats?.total ?? "—",
      icon: Inbox,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Open",
      value: stats?.open ?? "—",
      icon: Inbox,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: "In Progress",
      value: stats?.in_progress ?? "—",
      icon: BarChart3,
      color: "text-yellow-600",
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
    },
    {
      label: "Pending",
      value: stats?.pending ?? "—",
      icon: Clock,
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-900/20",
    },
    {
      label: "Resolved Today",
      value: stats?.resolved_today ?? "—",
      icon: Clock,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-900/20",
    },
    {
      label: "Overdue",
      value: stats?.overdue ?? "—",
      icon: AlertCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          Admin Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Overview of your support operation
        </p>
      </div>

      {/* Ticket stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <p className="text-2xl font-black text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Teams ({teams.length})
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => router.push(orgRoute(orgSlug, "/admin/teams"))}
                className="gap-1.5"
              >
                Manage
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {teams.length === 0 ? (
              <p className="text-sm text-muted-foreground">No teams created yet.</p>
            ) : (
              <ul className="space-y-2">
                {teams.slice(0, 5).map((team) => (
                  <li
                    key={team.id}
                    className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
                  >
                    <span className="text-sm font-medium text-foreground">{team.name}</span>
                    {team.description && (
                      <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {team.description}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Agents ({agents.length})
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => router.push(orgRoute(orgSlug, "/admin/agents"))}
                className="gap-1.5"
              >
                Manage
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {agents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No agents added yet.</p>
            ) : (
              <ul className="space-y-2">
                {agents.slice(0, 5).map((agent) => (
                  <li
                    key={agent.id}
                    className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
                  >
                    <span className="text-sm font-medium text-foreground">{agent.full_name}</span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        agent.status === "active"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : agent.status === "busy"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {agent.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
