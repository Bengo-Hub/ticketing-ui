# Sprint 11: Analytics and CSAT

**Status: Pending.** It consumes [API sprint 12](../../../ticketing-api/docs/sprints/sprint-12-analytics-csat.md).

## Tasks

- [ ] KPI cards with the change against the previous period from the API
- [ ] Agent inbox Resolved today and Overdue cards from the API stats
- [ ] SLA compliance, first response time and resolution time charts
- [ ] CSAT score and trend
- [ ] Agent leaderboard
- [ ] Team and agent filters
- [ ] Export through the API's reports module output
- [ ] Public CSAT page for the survey token

## Acceptance criteria

- The dashboard loads in under a second on a tenant with 200k tickets.
- A customer rates a resolved ticket once from the survey link; a second use of the link is refused.

## Fix requirements proved

- **Fix 5, reports stay fast as data grows.** The dashboard reads only rollup endpoints, which the API benchmark keeps under 300 ms p95.
