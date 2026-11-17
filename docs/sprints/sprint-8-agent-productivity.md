# Sprint 8: Agent Productivity, App Shell and Offline

**Status: Partial.** It consumes [API sprint 9](../../../ticketing-api/docs/sprints/sprint-9-agent-productivity.md). The workspace half is built against the API sprint 9 handlers; @mentions wait on a shared-ui-lib release, and the offline inbox is still open.

## Tasks

### Workspace

- [x] Views sidebar with saved filters per agent. The inbox lists everything, my views and the team's shared views. I can save the filters, search and order on screen, rename a view, replace its filters with the current ones, and delete it. Sharing a view, and changing a shared one, needs `tickets.manage`, the same rule the API applies. Below lg the list folds behind a toggle above the table.
- [x] Keyset paging on the inbox and the agent queue. Both read `{data, next_cursor, has_more}` through TanStack `useInfiniteQuery` and show a "Load more" footer with the count of loaded rows; the offset paging and every total-based label are gone. A new search term or filter starts again from the first page. Comments and attachments on a ticket page the same way.
- [x] Keyset paging on the agents and teams lists (written 2026-11-17). `/admin/agents` and `/admin/teams` read `{data, next_cursor, has_more}` newest first through `useAgentList` and `useTeamList` with the "Load more" footer, and the header counts loaded rows ("25+ agents" while more exist). Pickers and the dashboard read the first page of 100 through `useAgents` and `useTeams` and list names alphabetically; the dashboard's team count shows "100+" when the tenant has more.
- [x] Keyset paging on the KB lists: `/admin/kb`, `/[orgSlug]/kb` and the public help center read `{data, next_cursor, has_more}` with a "Load more" footer (written 2026-11-17, with UI sprint 12)
- [x] Ticket search wired to the API search (ticket number, subject, description and requester), debounced, with the older request aborted.
- [x] Tags as a filter, with the shared `MultiSelectCombobox` over `GET /tickets/tags` (a ticket must carry every chosen tag), and as an editor in the properties pane that adds from the tenant's tags or creates a new one.
- [x] Bulk bar. Staff with `tickets.change` select rows in the inbox table and set status, priority, assignee (available agents first, least loaded first), team, or add a tag, up to 100 tickets at a time. Tickets the API could not change are listed by number with the reason.
- [x] Macro picker in the composer. Applying a macro calls the apply endpoint, which makes the field changes and posts the reply in one step, and the outcome stays under the picker. Macros are managed on `/admin/macros` (table and sheet with the shared `RichTextEditor` body and an actions editor), gated by `kb.manage` like the API.
- [x] Merge and link dialogs. Merge searches another ticket by number or subject, explains what happens and lands on the ticket that carries on; a merged ticket shows where it continues. The links panel lists parent, child, related and duplicate tickets and adds or removes them.
- [x] Collision banner. An open ticket tells the API the agent is viewing every 15 seconds while the page is visible, typing while the composer has focus and text, and leaves on close. Who else is there comes from `GET /presence` and the `presence.changed` event, and someone typing shows in the warning colour. Staff only.
- [ ] @mentions in the composer. The composer passes the active agents to the editor through one adapter, `src/components/tickets/mentions.ts`, which stays off until the app moves to shared-ui-lib v0.1.147 or later. Comments already render mention spans as pills, and the sanitiser keeps only `data-type`, `data-id` (a UUID) and `data-label` on them.
- [x] Attachment dropzone and list with signed download links. Files dropped on the composer go up after the reply, attached to it; staff can keep them internal and an internal note's files are internal anyway. The files panel downloads through a fresh five-minute link on each click, and deletes for whoever may (any file with `attachments.delete`, their own with `attachments.delete_own`). Customers see and add files on their own tickets.
- [x] Comment author names (written 2026-11-17). Each message shows the API's `author_name` with the role beside it (Agent, Customer), or the role alone when the API knows no name. A channel sender named as the author keeps only their address beside the name.

### App shell and offline

- [ ] App shell adapted from the maskani console shell and the pos-ui mobile bottom nav
- [x] A service worker that ships in the production image. A hand-written `public/sw.js` replaced next-pwa in commit 1001e94, so it works with the Turbopack build.
- [ ] Offline reading of the inbox and queued replies through shared-ui-lib `offline`
- [x] English and Swahili, through the typed catalogues in `messages/` (commit 1001e94). Every screen added in this sprint uses them, and the agent queue moved off its hard-coded English.

### Public support pages

- [ ] Shared form fields and the shared `RichTextEditor` in place of native fields and the plain textarea. The editor is in place since commit 1001e94; the remaining native fields are still open.

## Acceptance criteria

- At 390 px and on desktop, an agent filters by a saved view, selects ten tickets and changes their status in one action.
- A second agent opening the same ticket sees the viewing warning within 2 seconds, and the typing warning while the first agent types.
- The production build serves a service worker, and the inbox opens offline after one online visit.

## Fix requirements proved

- **Fix 3, no missed duplicate replies.** The Playwright test with two agents on one ticket.
- **Fix 1, no feature behind an add-on.** The Playwright test on a tier-1 tenant that creates, assigns, comments on, merges and resolves a ticket with a macro.
- **Flip, offline and mobile-first.** The offline and 390 px checks above.

The Playwright tests above are not written yet.

## Known gaps

- The comment list pages oldest first only, so a long thread opens at its start and later replies load under it. A newest-first order on the API would let the thread open at the latest reply and load older ones.
- The list API filters by one status at a time, so the agent queue tabs (active, pending) split the loaded tickets in the browser and its counts cover loaded tickets only.
- Bulk failures show the API's own reason text, which is English.
