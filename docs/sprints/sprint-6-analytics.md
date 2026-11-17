# Sprint 6: Analytics Dashboard

**Status: Replaced by [sprint 11](sprint-11-analytics-csat.md).** The first dashboard read the old `GET /tickets/analytics` and `GET /tickets/stats` routes and worked out the previous period in the browser. API sprint 12 removed both routes, and sprint 11 rebuilt the dashboard and the analytics page on the rollup routes.

## Tasks

- [x] `/admin/analytics` with a period switch, KPI cards in the maskani `kpi-card` pattern, created and resolved trend, status and priority charts (recharts)
- [x] Previous-period figures from the API instead of a doubled trend (sprint 11)
- [x] Agent leaderboard, SLA compliance, first response and resolution times, CSAT (sprint 11)
- [x] Team and agent filters, export (sprint 11)

## Acceptance criteria

- The KPI cards match the API's counts for the period.
