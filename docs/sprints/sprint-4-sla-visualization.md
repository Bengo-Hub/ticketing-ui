# Sprint 4 — SLA Visualization

**Duration**: Week 5  
**Status**: 🔲 Pending (depends on API Sprint 3)

---

## Overview

Visual SLA indicators on ticket cards and detail pages: countdown timers, breach badges, and escalation warnings. Depends on Sprint 3 of the API adding SLA due times to ticket responses.

---

## Deliverables

### Components

**`SLATimer`** — countdown display:
- Green: > 50% time remaining
- Amber: 10–50% time remaining
- Red: < 10% remaining
- Red pulsing: breached

**`SLAStatusBadge`** — icon + text badge shown on ticket card and list row:
- `on_track`, `at_risk`, `breached_first_response`, `breached_resolution`

**`SLASidebar`** — ticket detail right panel section:
- First response target + actual (or countdown)
- Resolution target + actual (or countdown)
- Policy name, business hours flag

### Ticket List Changes
- Add SLA column to agent inbox
- Sort tickets by `sla_due_at` ascending (most urgent first) by default

### Ticket Detail Changes
- SLA sidebar section shows first response and resolution times
- Breach warning banner at top of detail page when breached

### API Changes Required
Ticket detail response needs:
```json
{
  "sla": {
    "policy_name": "Standard",
    "first_response_due_at": "2026-05-21T10:30:00Z",
    "first_response_at": null,
    "first_response_breached": false,
    "resolution_due_at": "2026-05-22T10:30:00Z",
    "resolution_breached": false
  }
}
```

---

## Definition of Done

- [ ] SLATimer countdown component
- [ ] SLAStatusBadge on ticket cards
- [ ] SLA sidebar section on ticket detail
- [ ] Amber/red breach indicators
- [ ] pnpm build passes clean

---

## Next Sprint

**Sprint 5**: Knowledge Base UI — article browser and search for customers and agents.
