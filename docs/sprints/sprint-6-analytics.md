# Sprint 6 — Analytics Dashboard

**Duration**: Week 7  
**Status**: 🔲 Pending (depends on API Sprint 6)

---

## Overview

Analytics dashboard for supervisors and admins: ticket volumes, agent performance, SLA compliance charts, and CSAT trend.

---

## Deliverables

### Routes
- `GET /[orgSlug]/admin/analytics` — main analytics page
- `GET /[orgSlug]/admin/analytics/agents` — per-agent performance table
- `GET /[orgSlug]/admin/analytics/sla` — SLA compliance charts

### Components

**KPI Cards Row**
- Total tickets this period
- % resolved within SLA
- Average first response time
- Average CSAT score

**Ticket Volume Chart** — `recharts` line/bar chart, group by day/week, filterable by status

**Agent Leaderboard** — table sorted by CSAT → resolution time → tickets resolved

**SLA Compliance Gauge** — donut chart showing compliant vs breached per priority tier

**CSAT Trend** — sparkline + rolling 30-day average

### Filters
- Date range picker (last 7d / 30d / 90d / custom)
- Team filter
- Agent filter

### Export Button
- Downloads CSV from `GET /{tenant}/analytics/export?format=csv&...`

---

## Definition of Done

- [ ] KPI cards connected to analytics API
- [ ] Ticket volume line chart
- [ ] Agent performance table
- [ ] SLA compliance chart
- [ ] CSAT trend sparkline
- [ ] CSV export button
- [ ] pnpm build passes clean

---

## Next Sprint

**Sprint 7**: Real-time Updates — live ticket feed, browser push notifications.
