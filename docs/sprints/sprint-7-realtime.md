# Sprint 7 — Real-time Updates

**Duration**: Week 8  
**Status**: 🔲 Pending

---

## Overview

Live updates for the agent workspace: new ticket notifications, comment thread updates, and agent status changes without page refresh. Uses Server-Sent Events (SSE) from the ticketing-api.

---

## Deliverables

### 1. SSE Stream Endpoint (API addition)
- `GET /api/v1/{tenant}/stream` — SSE connection (JWT auth required)
- Events:
  - `ticket.created` — new ticket in agent's queue
  - `ticket.assigned` — ticket assigned to this agent
  - `ticket.comment.added` — new comment on open ticket
  - `ticket.status.changed` — status update
  - `agent.status.changed` — colleague availability changed

### 2. SSE Client Hook
```tsx
// src/hooks/useTicketStream.ts
function useTicketStream(orgSlug: string) {
    useEffect(() => {
        const es = new EventSource(`/api/v1/${orgSlug}/stream`, {
            withCredentials: true,
        })
        es.addEventListener('ticket.created', handler)
        // ...
        return () => es.close()
    }, [orgSlug])
}
```

### 3. Agent Inbox Live Updates
- New ticket toast notification with sound (configurable)
- Inbox list auto-refreshes via TanStack Query `invalidateQueries` on SSE event
- Unread badge on sidebar ticket count

### 4. Ticket Detail Live Comments
- Comment thread auto-appends new comments without full reload
- Typing indicator: "Agent is typing..." (future — needs presence infrastructure)

### 5. Browser Push Notifications
- Request `Notification` permission on first login
- Show native OS notification when a ticket is assigned while tab is in background
- Uses Service Worker + Push API (optional, nice-to-have)

---

## Definition of Done

- [ ] SSE connection hook with reconnect logic
- [ ] Agent inbox refreshes on new ticket event
- [ ] Comment thread updates in real-time
- [ ] Unread count badge in sidebar
- [ ] pnpm build passes clean
