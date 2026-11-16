"use client";

import { useEffect } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { NORMALISED_BASE_URL } from "@/lib/api-client";
import { openStream, type StreamMessage } from "@/lib/sse/stream";
import { useAuthStore } from "@/store/auth";
import { presenceKey } from "@/hooks/usePresence";
import type { PresenceEntry, PresenceState } from "@/types/workspace";

/** Payload of a stream event (`{"type": ..., "payload": {"ticket_id": ..., ...}}`). */
interface EventPayload {
  ticket_id?: string;
  user_id?: string;
  agent_id?: string | null;
  name?: string;
  state?: PresenceState | "left";
}

function payloadOf(msg: StreamMessage): EventPayload {
  try {
    return (JSON.parse(msg.data) as { payload?: EventPayload }).payload ?? {};
  } catch {
    return {};
  }
}

/** The API keeps presence for 30 seconds; an entry from an event gets the same lifetime. */
const PRESENCE_TTL_MS = 30_000;

/**
 * Adds, updates or removes the person an event names in the ticket's presence list. Only a ticket
 * someone has open keeps a list, so events for other tickets are ignored.
 */
function applyPresence(qc: QueryClient, slug: string, p: EventPayload) {
  if (!p.ticket_id || !p.user_id) return;
  const userId = p.user_id;
  qc.setQueryData<PresenceEntry[]>(presenceKey(slug, p.ticket_id), (old) => {
    if (!old) return old;
    const rest = old.filter((e) => e.user_id !== userId);
    if (p.state !== "viewing" && p.state !== "typing") return rest;
    const entry: PresenceEntry = {
      user_id: userId,
      agent_id: p.agent_id,
      name: p.name ?? "",
      state: p.state,
      expires_at: new Date(Date.now() + PRESENCE_TTL_MS).toISOString(),
    };
    return [...rest, entry];
  });
}

/**
 * Invalidates the queries an event touches. Keys must match the hooks exactly: useTickets.ts,
 * useAttachments.ts and usePresence.ts. Both streams carry every event of the tenant, so each
 * event names its ticket.
 */
function applyEvent(qc: QueryClient, slug: string, msg: StreamMessage) {
  const payload = payloadOf(msg);
  const id = payload.ticket_id;
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
    case "attachment.created":
    case "attachment.deleted":
      if (id) void qc.invalidateQueries({ queryKey: ["ticket-attachments", slug, id] });
      break;
    case "presence.changed":
      applyPresence(qc, slug, payload);
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
