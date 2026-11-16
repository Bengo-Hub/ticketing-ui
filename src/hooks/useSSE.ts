"use client";

import { useEffect } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { NORMALISED_BASE_URL } from "@/lib/api-client";
import { openStream, type StreamMessage } from "@/lib/sse/stream";
import { useAuthStore } from "@/store/auth";

/** Ticket id carried by a stream event (`{"type": ..., "payload": {"ticket_id": ...}}`). */
function ticketIdOf(msg: StreamMessage): string | undefined {
  try {
    const parsed = JSON.parse(msg.data) as { payload?: { ticket_id?: string } };
    return parsed.payload?.ticket_id;
  } catch {
    return undefined;
  }
}

/** Invalidates the queries an event touches. Keys must match useTickets.ts exactly. */
function applyEvent(qc: QueryClient, slug: string, msg: StreamMessage) {
  const id = ticketIdOf(msg);
  switch (msg.event) {
    case "ticket.created":
      void qc.invalidateQueries({ queryKey: ["tickets"] });
      void qc.invalidateQueries({ queryKey: ["ticket-stats", slug] });
      break;
    case "ticket.updated":
      void qc.invalidateQueries({ queryKey: ["tickets"] });
      void qc.invalidateQueries({ queryKey: ["ticket-stats", slug] });
      if (id) void qc.invalidateQueries({ queryKey: ["ticket", slug, id] });
      break;
    case "comment.created":
      if (id) void qc.invalidateQueries({ queryKey: ["ticket-comments", slug, id] });
      break;
  }
}

function useStream(path: string | null, slug: string) {
  const qc = useQueryClient();
  const signedIn = useAuthStore((s) => !!s.session?.accessToken);

  useEffect(() => {
    if (!path || !slug || !signedIn) return;
    return openStream(`${NORMALISED_BASE_URL}${path}`, {
      onMessage: (msg) => applyEvent(qc, slug, msg),
      onReconnect: () => void qc.invalidateQueries({ refetchType: "active" }),
    });
    // Reconnect only when the path or sign-in state changes; each attempt reads the latest token.
  }, [path, slug, signedIn, qc]);
}

/** Live updates for the tenant's ticket lists and counters. */
export function useTicketStream(slug: string) {
  useStream(slug ? `api/v1/${slug}/tickets/stream` : null, slug);
}

/** Live updates for one ticket's conversation. */
export function useCommentStream(slug: string, ticketId: string) {
  useStream(slug && ticketId ? `api/v1/${slug}/tickets/${ticketId}/stream` : null, slug);
}
