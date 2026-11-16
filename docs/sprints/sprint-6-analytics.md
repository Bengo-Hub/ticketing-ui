# Sprint 6: Analytics Dashboard

**Status: Partial.** KPI cards and volume, status and priority charts are built on the existing analytics endpoint. Agent, SLA and CSAT reports, filters and export wait on API sprint 12.

## Tasks

- [x] `/admin/analytics` with a period switch, KPI cards in the maskani `kpi-card` pattern, created and resolved trend, status and priority charts (recharts)
- [x] Change against the previous period on created and resolved, from a trend for twice the period, shown only while the doubled window still has daily buckets (90 days or less)
- [ ] Previous-period figures from the API instead of the doubled trend (sprint 11)
- [ ] Agent leaderboard, SLA compliance, first response and resolution times, CSAT (sprint 11)
- [ ] Team and agent filters, export (sprint 11)

## Acceptance criteria

- The KPI cards match the API's counts for the period. Met.
