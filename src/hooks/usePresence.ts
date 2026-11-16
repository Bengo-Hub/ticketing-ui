"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getPresence, leavePresence, setPresence } from "@/lib/api/workspace";
import type { PresenceEntry } from "@/types/workspace";

/** How often the open ticket refreshes "viewing", and "typing" while the agent types. */
const VIEWING_EVERY_MS = 15_000;
const TYPING_EVERY_MS = 10_000;

export const presenceKey = (slug: string, ticketId: string) => ["ticket-presence", slug, ticketId] as const;

const statusOf = (err: unknown) => (err as { response?: { status?: number } })?.response?.status;

/**
 * Collision presence on one ticket, for staff. While the page is visible it tells the API the
 * agent is viewing (or typing, through setTyping) and refreshes that before the API's 30 second
 * expiry; leaving the page removes the agent. Who else is there comes from GET and from the
 * presence.changed events useSSE writes into the same cache. When the API has no presence store
 * (503) the hook goes quiet instead of retrying.
 */
export function usePresence(slug: string, ticketId: string, opts: { enabled: boolean; selfUserId?: string }) {
  const qc = useQueryClient();
  const [unavailable, setUnavailable] = useState(false);
  const [typing, setTyping] = useState(false);
  const active = opts.enabled && !!slug && !!ticketId && !unavailable;

  const query = useQuery({
    queryKey: presenceKey(slug, ticketId),
    queryFn: () => getPresence(slug, ticketId),
    enabled: active,
    refetchInterval: VIEWING_EVERY_MS,
    staleTime: VIEWING_EVERY_MS,
    retry: false,
  });

  useEffect(() => {
    if (!active) return;
    let stopped = false;
    const beat = () => {
      if (document.visibilityState !== "visible") return;
      setPresence(slug, ticketId, typing ? "typing" : "viewing")
        .then((list) => {
          if (!stopped) qc.setQueryData(presenceKey(slug, ticketId), list);
        })
        .catch((err: unknown) => {
          if (statusOf(err) === 503) setUnavailable(true);
        });
    };
    beat();
    const timer = setInterval(beat, typing ? TYPING_EVERY_MS : VIEWING_EVERY_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") beat();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [active, typing, slug, ticketId, qc]);

  // Leaving the ticket (or the page) removes the agent at once rather than after the expiry.
  useEffect(() => {
    if (!active) return;
    return () => {
      void leavePresence(slug, ticketId).catch(() => undefined);
    };
  }, [active, slug, ticketId]);

  const others = useMemo<PresenceEntry[]>(
    () =>
      (query.data ?? [])
        .filter((e) => e.user_id !== opts.selfUserId)
        // Someone typing is the stronger warning, so they come first.
        .sort((a, b) => (a.state === b.state ? a.name.localeCompare(b.name) : a.state === "typing" ? -1 : 1)),
    [query.data, opts.selfUserId],
  );

  return { others, setTyping };
}
