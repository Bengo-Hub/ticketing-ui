import { cn } from "@/lib/utils";
import type { TicketPriority } from "@/types/tickets";

interface PriorityBadgeProps {
  priority: TicketPriority;
  className?: string;
}

const priorityConfig: Record<TicketPriority, { label: string; className: string }> = {
  low: {
    label: "Low",
    className:
      "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400",
  },
  normal: {
    label: "Normal",
    className:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
  },
  high: {
    label: "High",
    className:
      "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400",
  },
  urgent: {
    label: "Urgent",
    className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400",
  },
  critical: {
    label: "Critical",
    className:
      "bg-red-200 text-red-800 border-red-300 font-bold dark:bg-red-900/50 dark:text-red-300 dark:border-red-700",
  },
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority] ?? {
    label: priority,
    className: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
