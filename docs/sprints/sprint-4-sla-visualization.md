# Sprint 4: SLA Visualization

**Status: Partial.** Timers, badges, the SLA panel and the breach banner are built, and the panel now names the clock and shows a paused clock (sprint 9). The inbox is not sorted by SLA due time.

## Tasks

- [x] `SLATimer` countdown with breached state
- [x] `SLAStatusBadge` on list rows
- [x] `SLASidebar` with first response and resolution targets, or the time each was met
- [x] Breach banner on ticket detail when a target is missed
- [x] Past SLA count on the agent inbox
- [ ] Inbox sorted by `sla_due_at` by default (sprint 9)
- [x] `SLASidebar` names the policy's calendar or says 24x7, and shows a paused clock (sprint 9, with API sprint 10)
- [ ] Policy name on the panel (needs the API to return it)

## Acceptance criteria

- A breached ticket shows the banner and a breached timer. Met.
