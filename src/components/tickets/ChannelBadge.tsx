"use client";

import { Building2, Globe, Mail, MessageCircle, MessagesSquare, Phone, Plug, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTicketLabels } from "@/lib/ticket-options";
import type { TicketChannel } from "@/types/tickets";

const CHANNEL_ICON: Record<TicketChannel, LucideIcon> = {
  web: Globe,
  email: Mail,
  api: Plug,
  chat: MessagesSquare,
  whatsapp: MessageCircle,
  phone: Phone,
  internal: Building2,
};

const CHANNEL_CLASS: Partial<Record<TicketChannel, string>> = {
  whatsapp: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400",
  email: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400",
};

/**
 * Where the ticket came from, as an icon and a label. `iconOnly` keeps the label for screen
 * readers and as a tooltip, for tight rows on phones.
 */
export function ChannelBadge({
  channel,
  iconOnly,
  className,
}: {
  channel: TicketChannel;
  iconOnly?: boolean;
  className?: string;
}) {
  const labels = useTicketLabels();
  const Icon = CHANNEL_ICON[channel] ?? Globe;
  const label = labels.channel(channel);
  return (
    <span
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border text-xs font-medium",
        iconOnly ? "p-1" : "px-2 py-0.5",
        CHANNEL_CLASS[channel] ?? "border-border bg-muted text-muted-foreground",
        className,
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {iconOnly ? <span className="sr-only">{label}</span> : label}
    </span>
  );
}
