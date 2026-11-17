# Sprint 9: SLA Admin and Inbox Order

**Status: Partial, written and not yet built or tested.** It consumes [API sprint 10](../../../ticketing-api/docs/sprints/sprint-10-sla-leaders.md). The calendars page, the new policy settings, the SLA report and the paused clock are in place on shared-ui-lib v0.1.147. Type-check, lint, the build and the Playwright tests have not run yet. The SLA due inbox order was written on 2026-11-17; escalation level on rows and the fresh-tenant test are still open.

## Tasks

- [x] Business calendars page at `/admin/sla/calendars`: a `DataTable` of calendars with their open days, hours a week and coming holidays, and a sheet that edits the name, the timezone (every IANA zone, Africa/Nairobi first), the default flag, opening and closing times per weekday with several periods a day, and the holiday list. Moon-dependent holidays such as Idd ul-Fitr are highlighted for the tenant to confirm, and every row stays editable. A calendar a policy still uses cannot be deleted, and the page says so when the API answers 409
- [x] SLA policy sheet: the clock picker (a calendar or 24x7), the pre-breach warning in minutes (0 to 10080), pausing on pending internal, and an escalation editor of up to five levels, each with its target, minutes before or after the breach, raising the priority and a team. Validation follows the API limits, and the metadata keys this sheet does not edit are kept on save
- [x] The removed business-hours flags are gone from the policy types, sheet and list; the list shows each policy's clock instead
- [x] Macros admin page (sprint 8)
- [x] Inbox sorted by SLA due time by default (written 2026-11-17). Staff open `/tickets` and the agent queue with `sort=sla_due`: running clocks by due time, then tickets with no target, then paused clocks. An order control (SLA due first, newest first, oldest first) replaces the newest and oldest toggle; customers see only the two date orders. A saved view keeps the order in effect, and a view saved with `sla_due` restores it
- [x] `SLASidebar` shows a paused clock with the reason (waiting on the customer or on our team), when it stopped, that the deadlines move on restart, and the paused time so far. It names the policy and its calendar, or says 24x7, from the names the ticket carries (since 2026-11-17, for everyone who sees the ticket), and for people who may read SLA settings the countdown turns amber inside the policy's warning lead. The fixed four-hour colour window is gone
- [x] `SLAStatusBadge` reads paused, overdue, breached or on track from the ticket alone; the "at risk" state, which rested on a fixed window, is removed
- [ ] Escalation level and pre-breach state on list rows and the detail page
- [x] SLA report page at `/admin/sla/report` on `GET /sla/reports` (`analytics.view`): date range, team, agent and priority filters, KPI cards for tickets, compliance, averages and p90, and by-priority and by-team tables with CSV export. Figures the API returns as null show as "-"
- [x] Navigation entries for business calendars (`sla.view`) and the SLA report (`analytics.view`), and tabs between the three SLA pages
- [x] Every new string is in `messages/en.json` and `messages/sw.json`

## Acceptance criteria

- A ticket waiting on the customer shows its SLA clock as paused. Written, not yet tested in a browser.
- A tenant that never opens an admin page still has working SLA timers from the seeded defaults. Depends on the API seed; the Playwright test is still to come.

## Gaps in the API

- The ticket carries only `sla_policy_id`, so the calendar name needs two more requests (the policy, then its calendar), and agents without `sla.view` see no clock line. A policy and calendar name on the ticket response would close that.
- The pre-breach warning state is only in ticket metadata as a dedupe marker, so the UI cannot show "warning sent" yet.

## Fix requirements proved

- **Fix 2, low learning curve.** The Playwright test that takes a fresh tenant from first ticket to resolution without opening an admin page. Not written yet.
