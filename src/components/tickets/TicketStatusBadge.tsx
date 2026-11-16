"use client";

import { cn } from "@/lib/utils";
import { useTicketLabels } from "@/lib/ticket-options";
import type { TicketStatus } from "@/types/tickets";

interface TicketStatusBadgeProps {
  status: TicketStatus;
  className?: string;
}

const STATUS_CLASS: Record<TicketStatus, string> = {
  new: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300",
  open: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
  in_progress: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400",
  pending_customer: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400",
  pending_internal: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400",
  resolved: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400",
  closed: "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400",
  cancelled: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400",
};

export function TicketStatusBadge({ status, className }: TicketStatusBadgeProps) {
  const labels = useTicketLabels();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        STATUS_CLASS[status] ?? "bg-gray-100 text-gray-700 border-gray-200",
        className,
      )}
    >
      {labels.status(status)}
    </span>
  );
}
