# Sprint 4: SLA Visualization

**Status: Partial.** Timers, badges, the SLA panel and the breach banner are built, and the panel now names the clock and shows a paused clock (sprint 9). On 2026-11-17 I wrote the SLA due inbox order and the policy name on the panel; they are not yet built or deployed.

## Tasks

- [x] `SLATimer` countdown with breached state
- [x] `SLAStatusBadge` on list rows
- [x] `SLASidebar` with first response and resolution targets, or the time each was met
- [x] Breach banner on ticket detail when a target is missed
- [x] Past SLA count on the agent inbox
- [x] Inbox sorted by SLA due time by default for staff, with an order control (written 2026-11-17, UI sprint 9)
- [x] `SLASidebar` names the policy's calendar or says 24x7, and shows a paused clock (sprint 9, with API sprint 10)
- [x] Policy name on the panel, beside the SLA title. The ticket now carries `sla_policy_name` and `sla_calendar_name`, so everyone who sees the ticket sees the policy and its clock without the SLA settings permission (written 2026-11-17)

## Acceptance criteria

- A breached ticket shows the banner and a breached timer. Met.
