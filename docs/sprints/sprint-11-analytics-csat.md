# Sprint 11: Analytics and CSAT

**Status: Written, not yet built or deployed.** It consumes [API sprint 12](../../../ticketing-api/docs/sprints/sprint-12-analytics-csat.md), whose contract is [analytics.md](../../../ticketing-api/docs/analytics.md).

## What changed

The API removed `GET /tickets/stats` and `GET /tickets/analytics`. The UI no longer calls either. Every count and trend now comes from the four rollup routes under `/api/v1/{tenant}/analytics`, and the change against the previous period is the API's own `change` object, not a figure worked out in the browser from a doubled trend.

- `src/lib/api/analytics.ts`, `src/hooks/useAnalytics.ts` and `src/types/analytics.ts` hold the client, the hooks and the response shapes. `getTicketStats`, `getTicketAnalytics`, `useTicketStats`, `useTicketAnalytics`, the `TicketStats`, `TrendPoint` and `TicketAnalytics` types and the old period helpers in `src/lib/analytics.ts` are gone.
- Query keys start with `["analytics", tenantSlug]`. Ticket mutations, macros and the live stream mark every analytics view stale through that prefix, where they used to mark `ticket-stats`.
- `KpiCard` takes `change` (the API's `*_pct` or `*_delta` value, null when there is nothing to compare) and `changeKind` (`percent`, `points` or `score`). It says the direction in words with an arrow, never by colour alone, and its wording is in English and Swahili.

## Tasks

- [x] KPI cards with the change against the previous period from the API, naming the previous period's dates
- [x] Admin dashboard on `/analytics/tickets` for the last seven days: open, new, in progress, pending, overdue, unassigned, created today and resolved today live, then created, resolved and the CSAT average against the seven days before
- [x] Agent inbox Resolved today and Overdue cards from the analytics stats filtered to the agent, shown to people with `ticketing.analytics.view`
- [x] `/admin/analytics` with four views: Tickets, Agents, SLA and CSAT
- [x] Tickets view: live counts, period KPIs, created and resolved trend, open by status, and the by priority, channel, category and team breakdowns
- [x] Agents view: the leaderboard in the API's order (most resolved, then most open) with each agent's change in resolved, live open count, times, resolution on time and CSAT, plus a chart of the top ten
- [x] SLA view: overdue, first response and resolution on time (change in points), both average times, a compliance trend, a response and resolution time trend, and the by priority, team and agent breakdowns
- [x] CSAT view: average rating (change on the 1 to 5 scale), satisfied share (change in points), responses, a ratings trend, the spread by score, the by agent, team and channel breakdowns and the 20 latest comments linking to their tickets
- [x] Filters for the date range (with 7, 30 and 90 day shortcuts), team, agent, category, channel and priority; `tz` is the browser's time zone. The view and the filters live in the address, so a link reopens the same figures. The agents view hides the agent filter
- [x] PDF, CSV and XLSX buttons calling `/analytics/{view}/export` with the same query and saving the file under the API's file name
- [x] The period line under the filters: the effective window, the time zone, how far the rollup has read, and a notice while the first backfill is still running
- [x] Public CSAT page at `/support/csat?tenant=&token=` with an optional `&score=1..5` that preselects a score. It checks the token, shows the ticket number and subject, takes a score from 1 to 5 and an optional comment of up to 2000 characters, and words 404 (unknown or replaced link), 409 (already answered) and 410 (expired) on their own. It sits under the public support layout and, like every page except `/support/widget`, may be framed only by this app
- [x] Every new string in English and Swahili
- [ ] Type-check, lint and build
- [ ] Check every view and the three exports against the deployed API, at 390 pixels and on a desktop
- [ ] Rate a resolved ticket from a real survey email, then open the link again

## Acceptance criteria

- The dashboard loads in under a second on a tenant with 200k tickets.
- A customer rates a resolved ticket once from the survey link; a second use of the link shows "Already answered".
- An export opens with the same figures, window and filters as the screen it was downloaded from.
- At 390 pixels wide every view reads without sideways scrolling: the breakdown tables turn into cards and the export buttons share one row.

## Fix requirements proved

- **Fix 5, reports stay fast as data grows.** The dashboard, the analytics views and the agent inbox cards read only the rollup routes, which the API benchmark keeps under 300 ms p95.
