# Sprint 7: Real-time Updates

**Status: Partial.** Live updates refresh lists, tickets and comments over Server-Sent Events. Toasts, unread badges, push notifications and presence are not built.

## Tasks

- [x] `src/lib/sse/stream.ts` reads the stream with fetch and sends the bearer and tenant headers; tokens never go in the URL (the earlier `EventSource` with `?token=` got 401)
- [x] Reconnect with backoff from 2 seconds to 30 seconds, fresh headers on every attempt, and a refetch of active queries after a reconnect
- [x] `useSSE` invalidates the query keys `useTickets` uses, so lists, the ticket and its comments refresh
- [x] Streams on `/api/v1/{tenant}/tickets/stream` and `/tickets/{ticketId}/stream`, which need `ticketing.tickets.view`; customers have no stream
- [ ] Toast on a new or newly assigned ticket
- [ ] Unread count on the sidebar
- [ ] Browser push while the tab is in the background (needs the service worker, sprint 8)
- [ ] Viewing and typing presence (sprint 8, with API sprint 9)

## Acceptance criteria

- A comment added by another agent appears on an open ticket without a reload. Met.
