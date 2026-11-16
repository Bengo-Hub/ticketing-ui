# Sprint 9: SLA Admin and Inbox Order

**Status: Pending.** It consumes [API sprint 10](../../../ticketing-api/docs/sprints/sprint-10-sla-leaders.md).

## Tasks

- [ ] Business-hours calendar page: weekly hours, timezone and holidays, with the seeded Kenyan public holidays shown
- [ ] SLA policy sheet gains the calendar, pre-breach warning minutes and escalation levels
- [ ] Macros admin page
- [ ] Inbox sorted by SLA due time by default
- [ ] `SLASidebar` shows the business-hours note only when the policy uses business hours, and shows paused clocks
- [ ] Escalation level and pre-breach state on list rows and the detail page
- [ ] SLA report page on `GET /sla/reports`

## Acceptance criteria

- A ticket waiting on the customer shows its SLA clock as paused.
- A tenant that never opens an admin page still has working SLA timers from the seeded defaults.

## Fix requirements proved

- **Fix 2, low learning curve.** The Playwright test that takes a fresh tenant from first ticket to resolution without opening an admin page.
