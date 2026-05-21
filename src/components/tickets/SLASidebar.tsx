import { CheckCircle2, Clock, ShieldAlert } from "lucide-react";
import { Separator } from "@/components/ui/base";
import { SLATimer } from "./SLATimer";
import { formatDateTime } from "@/lib/utils";
import type { Ticket } from "@/types/tickets";

interface SLASidebarProps {
  ticket: Ticket;
}

export function SLASidebar({ ticket }: SLASidebarProps) {
  const hasSLA = ticket.sla_response_due_at || ticket.sla_resolution_due_at;
  if (!hasSLA) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">SLA</span>
      </div>

      <Separator />

      {/* First Response */}
      {ticket.sla_response_due_at && (
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
            First Response
          </p>
          {ticket.first_response_at ? (
            <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="font-semibold">Responded</span>
              <span className="text-muted-foreground">{formatDateTime(ticket.first_response_at)}</span>
            </div>
          ) : (
            <SLATimer
              dueAt={ticket.sla_response_due_at}
              breached={ticket.sla_response_breached}
              label="Due"
            />
          )}
        </div>
      )}

      {/* Resolution */}
      {ticket.sla_resolution_due_at && (
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
            Resolution
          </p>
          {ticket.resolved_at ? (
            <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="font-semibold">Resolved</span>
              <span className="text-muted-foreground">{formatDateTime(ticket.resolved_at)}</span>
            </div>
          ) : (
            <SLATimer
              dueAt={ticket.sla_resolution_due_at}
              breached={ticket.sla_resolution_breached}
              label="Due"
            />
          )}
        </div>
      )}

      {/* Business hours note */}
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>Business hours apply</span>
      </div>
    </div>
  );
}
