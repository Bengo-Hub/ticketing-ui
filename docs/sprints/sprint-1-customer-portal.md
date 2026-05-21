# Sprint 1 — Customer Portal

**Duration**: Week 2  
**Status**: ✅ Complete

---

## Overview

The customer-facing portal: authenticated users can submit tickets, view their ticket list, read replies from agents, and add follow-up comments.

---

## Deliverables

### Routes
- `GET /[orgSlug]/tickets` — paginated ticket list with status/priority filters
- `GET /[orgSlug]/tickets/new` — new ticket form
- `GET /[orgSlug]/tickets/[ticketId]` — ticket detail with comment thread

### Components
- `TicketStatusBadge` — colour-coded status chip
- `PriorityBadge` — priority indicator
- Ticket list with filter bar (status, priority dropdowns)
- Ticket create form: subject, description, category selector, channel
- Ticket detail: metadata sidebar, comment thread, add reply textarea

### API Integration
- `src/lib/api/tickets.ts` — typed API client for ticket endpoints
- `src/hooks/useTickets.ts` — TanStack Query hooks (list, get, create, addComment)
- Pagination via `page` and `limit` query params; response shape `{ data, total, page, limit, hasMore }`

### Auth Guard
- All portal routes wrapped in `AuthGuard` — redirects to SSO login if no valid session
- `orgSlug` from URL param used as tenant scope for all API calls

---

## Definition of Done

- [x] Ticket list page with pagination
- [x] New ticket form with validation (React Hook Form + Zod)
- [x] Ticket detail with comment thread
- [x] Auth-guarded routes
- [x] pnpm build passes clean

---

## Next Sprint

**Sprint 2**: Agent Workspace — agent inbox, queue, ticket assignment controls.
