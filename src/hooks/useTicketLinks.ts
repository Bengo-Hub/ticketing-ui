"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTicketLink, deleteTicketLink, getTicketLinks } from "@/lib/api/workspace";
import type { CreateLinkData } from "@/types/workspace";

/** The ticket's parent, child, related and duplicate links (staff only). */
export function useTicketLinks(slug: string, ticketId: string, enabled = true) {
  return useQuery({
    queryKey: ["ticket-links", slug, ticketId],
    queryFn: () => getTicketLinks(slug, ticketId),
    enabled: enabled && !!slug && !!ticketId,
    staleTime: 60_000,
  });
}

export function useLinkTicket(slug: string, ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLinkData) => createTicketLink(slug, ticketId, data),
    onSuccess: (_d, data) => {
      void qc.invalidateQueries({ queryKey: ["ticket-links", slug, ticketId] });
      void qc.invalidateQueries({ queryKey: ["ticket-links", slug, data.ticket_id] });
    },
  });
}

export function useUnlinkTicket(slug: string, ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ linkId }: { linkId: string; otherId?: string }) => deleteTicketLink(slug, ticketId, linkId),
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ["ticket-links", slug, ticketId] });
      if (vars.otherId) void qc.invalidateQueries({ queryKey: ["ticket-links", slug, vars.otherId] });
    },
  });
}
