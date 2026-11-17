# Sprint 2: Agent Workspace

**Status: Done** for its scope: inbox, ticket detail, replies and status moves. Views, macros, bulk actions, merge and collision warnings are in [sprint 8](sprint-8-agent-productivity.md).

## Tasks

- [x] `/[orgSlug]/agent`: tickets assigned to the caller, filtered by the agent record (`agentId` from `auth/me`), on the shared `DataTable`
- [x] KPI cards: Active, Pending, Past SLA and Assigned in total, counted from the loaded queue. Resolved today and Overdue need API fields that do not exist yet (API sprint 12).
- [x] Ticket detail in three panes on wide screens (conversation, properties, SLA) and stacked on phones
- [x] Replies and internal notes through the shared `RichTextEditor` (`ReplyComposer`)
- [x] Properties: status, priority, category, team and agent through `SearchableCombobox`; only status moves the API accepts are offered
- [x] Comment author shown by name with the type beside it, from the API's `author_name` (written 2026-11-17, UI sprint 8)

## Acceptance criteria

- An agent replies, adds an internal note and moves the status without leaving the ticket. Met.
- A status the API would refuse is never offered. Met.
