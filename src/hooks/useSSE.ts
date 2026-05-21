"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

interface SSEEvent {
  type: string;
  payload: Record<string, unknown>;
}

/**
 * Subscribes to the tenant-scoped SSE ticket stream and invalidates
 * relevant TanStack Query caches on each event so pages refresh live.
 */
export function useTicketStream(orgSlug: string, token: string | null) {
  const qc = useQueryClient();
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!token || !orgSlug) return;

    let stopped = false;

    const connect = () => {
      if (stopped) return;

      const url = `${API_URL}/api/v1/${orgSlug}/tickets/stream`;
      // EventSource doesn't support custom headers natively;
      // pass token as query param (API must accept ?token= for SSE endpoints)
      const es = new EventSource(`${url}?token=${encodeURIComponent(token)}`);
      esRef.current = es;

      es.addEventListener("ticket.created", () => {
        void qc.invalidateQueries({ queryKey: ["tickets", orgSlug] });
      });

      es.addEventListener("ticket.updated", (e) => {
        try {
          const evt = JSON.parse(e.data) as SSEEvent;
          const ticketId = evt.payload?.ticket_id as string | undefined;
          void qc.invalidateQueries({ queryKey: ["tickets", orgSlug] });
          if (ticketId) {
            void qc.invalidateQueries({ queryKey: ["ticket", orgSlug, ticketId] });
          }
        } catch {
          void qc.invalidateQueries({ queryKey: ["tickets", orgSlug] });
        }
      });

      es.addEventListener("comment.created", (e) => {
        try {
          const evt = JSON.parse(e.data) as SSEEvent;
          const ticketId = evt.payload?.ticket_id as string | undefined;
          if (ticketId) {
            void qc.invalidateQueries({ queryKey: ["comments", orgSlug, ticketId] });
          }
        } catch {
          // ignore malformed events
        }
      });

      es.onerror = () => {
        es.close();
        esRef.current = null;
        // Exponential back-off capped at 30s
        if (!stopped) {
          retryRef.current = setTimeout(connect, 5000);
        }
      };
    };

    connect();

    return () => {
      stopped = true;
      if (retryRef.current) clearTimeout(retryRef.current);
      esRef.current?.close();
      esRef.current = null;
    };
  }, [orgSlug, token, qc]);
}

/**
 * Subscribes to a single ticket's comment stream.
 */
export function useCommentStream(orgSlug: string, ticketId: string, token: string | null) {
  const qc = useQueryClient();
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!token || !orgSlug || !ticketId) return;

    let stopped = false;

    const connect = () => {
      if (stopped) return;

      const url = `${API_URL}/api/v1/${orgSlug}/tickets/${ticketId}/stream`;
      const es = new EventSource(`${url}?token=${encodeURIComponent(token)}`);
      esRef.current = es;

      es.addEventListener("comment.created", () => {
        void qc.invalidateQueries({ queryKey: ["comments", orgSlug, ticketId] });
      });

      es.addEventListener("ticket.updated", () => {
        void qc.invalidateQueries({ queryKey: ["ticket", orgSlug, ticketId] });
      });

      es.onerror = () => {
        es.close();
        esRef.current = null;
        if (!stopped) {
          retryRef.current = setTimeout(connect, 5000);
        }
      };
    };

    connect();

    return () => {
      stopped = true;
      if (retryRef.current) clearTimeout(retryRef.current);
      esRef.current?.close();
      esRef.current = null;
    };
  }, [orgSlug, ticketId, token, qc]);
}
