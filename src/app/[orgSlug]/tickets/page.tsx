"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTickets } from "@/hooks/useTickets";
import { TicketStatusBadge } from "@/components/tickets/TicketStatusBadge";
import { PriorityBadge } from "@/components/tickets/PriorityBadge";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@/components/ui/base";
import { formatRelativeTime, orgRoute } from "@/lib/utils";
import type { TicketPriority, TicketStatus } from "@/types/tickets";
import { PlusCircle, Search, RefreshCw, AlertCircle } from "lucide-react";

const STATUS_OPTIONS: Array<{ label: string; value: TicketStatus | "" }> = [
  { label: "All Statuses", value: "" },
  { label: "New", value: "new" },
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in_progress" },
  { label: "Pending Customer", value: "pending_customer" },
  { label: "Pending Internal", value: "pending_internal" },
  { label: "Resolved", value: "resolved" },
  { label: "Closed", value: "closed" },
  { label: "Cancelled", value: "cancelled" },
];

const PRIORITY_OPTIONS: Array<{ label: string; value: TicketPriority | "" }> = [
  { label: "All Priorities", value: "" },
  { label: "Low", value: "low" },
  { label: "Normal", value: "normal" },
  { label: "High", value: "high" },
  { label: "Urgent", value: "urgent" },
  { label: "Critical", value: "critical" },
];

export default function TicketsPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TicketStatus | "">("");
  const [priority, setPriority] = useState<TicketPriority | "">("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useTickets({
    tenantSlug: orgSlug,
    search: search || undefined,
    status: status || undefined,
    priority: priority || undefined,
    page,
    page_size: 20,
  });

  const tickets = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">Tickets</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total > 0 ? `${total} total tickets` : "No tickets yet"}
          </p>
        </div>
        <Button onClick={() => router.push(orgRoute(orgSlug, "/tickets/new"))} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          New Ticket
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as TicketStatus | "");
                setPage(1);
              }}
              className="h-10 rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value as TicketPriority | "");
                setPage(1);
              }}
              className="h-10 rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Button variant="outline" size="icon" onClick={() => void refetch()} title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {isError ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">Failed to load tickets. Please try again.</p>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground font-medium">No tickets found.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try changing your filters or create a new ticket.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-border">
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => router.push(orgRoute(orgSlug, `/tickets/${ticket.id}`))}
                className="w-full text-left p-4 hover:bg-accent transition-colors group"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground font-bold">
                        #{ticket.ticket_number}
                      </span>
                      <TicketStatusBadge status={ticket.status} />
                      <PriorityBadge priority={ticket.priority} />
                      {ticket.sla_response_breached && (
                        <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 text-xs font-semibold">
                          SLA Breached
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {ticket.subject}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-muted-foreground">{formatRelativeTime(ticket.created_at)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
