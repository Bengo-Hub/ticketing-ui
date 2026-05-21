"use client";

import { useParams, useRouter } from "next/navigation";
import { useTickets, useTicketStats } from "@/hooks/useTickets";
import { useAuthStore } from "@/store/auth";
import { TicketStatusBadge } from "@/components/tickets/TicketStatusBadge";
import { PriorityBadge } from "@/components/tickets/PriorityBadge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/base";
import { formatRelativeTime, orgRoute } from "@/lib/utils";
import { HeadphonesIcon, Inbox, AlertCircle, Clock } from "lucide-react";

export default function AgentInboxPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;
  const user = useAuthStore((s) => s.user);

  const { data: statsData } = useTicketStats(orgSlug);

  const { data: assignedData, isLoading } = useTickets({
    tenantSlug: orgSlug,
    assigned_agent_id: user?.id,
    page: 1,
    page_size: 50,
  });

  const myTickets = assignedData?.data ?? [];
  const openTickets = myTickets.filter((t) => t.status === "open" || t.status === "in_progress");
  const pendingTickets = myTickets.filter(
    (t) => t.status === "pending_customer" || t.status === "pending_internal",
  );

  const stats = [
    {
      label: "Total Tickets",
      value: statsData?.total ?? "—",
      icon: Inbox,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Open",
      value: statsData?.open ?? "—",
      icon: Inbox,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: "In Progress",
      value: statsData?.in_progress ?? "—",
      icon: HeadphonesIcon,
      color: "text-yellow-600",
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
    },
    {
      label: "Overdue",
      value: statsData?.overdue ?? "—",
      icon: AlertCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      label: "Resolved Today",
      value: statsData?.resolved_today ?? "—",
      icon: Clock,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-900/20",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
          <HeadphonesIcon className="h-6 w-6 text-primary" />
          Agent Inbox
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your assigned tickets and queue overview
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <p className="text-2xl font-black text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* My Assigned Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              Active ({openTickets.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : openTickets.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No active tickets assigned to you.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {openTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => router.push(orgRoute(orgSlug, `/tickets/${ticket.id}`))}
                    className="w-full text-left p-4 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">
                        #{ticket.ticket_number}
                      </span>
                      <TicketStatusBadge status={ticket.status} />
                      <PriorityBadge priority={ticket.priority} />
                    </div>
                    <p className="text-sm font-semibold text-foreground truncate">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatRelativeTime(ticket.updated_at)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending ({pendingTickets.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : pendingTickets.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No pending tickets.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {pendingTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => router.push(orgRoute(orgSlug, `/tickets/${ticket.id}`))}
                    className="w-full text-left p-4 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">
                        #{ticket.ticket_number}
                      </span>
                      <TicketStatusBadge status={ticket.status} />
                    </div>
                    <p className="text-sm font-semibold text-foreground truncate">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatRelativeTime(ticket.updated_at)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
