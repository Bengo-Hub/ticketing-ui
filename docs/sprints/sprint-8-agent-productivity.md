# Sprint 8: Agent Productivity, App Shell and Offline

**Status: Pending.** It consumes [API sprint 9](../../../ticketing-api/docs/sprints/sprint-9-agent-productivity.md).

## Tasks

### Workspace

- [ ] Views sidebar with saved filters per agent
- [ ] Keyset paging on the inbox, agents, teams and KB lists (the shared `KeysetTable` pattern)
- [ ] Ticket search wired to the API's full-text search
- [ ] Tags on the ticket and as a filter (`MultiSelectCombobox`)
- [ ] Bulk bar for status, priority, assignee and tags
- [ ] Macro picker in the composer
- [ ] Merge and link dialogs, parent and child tickets on the detail page
- [ ] Collision banner: who is viewing and who is typing
- [ ] @mentions in the composer
- [ ] Attachment dropzone and list with signed download links
- [ ] Comment author names once the API returns them

### App shell and offline

- [ ] App shell adapted from the maskani console shell and the pos-ui mobile bottom nav
- [ ] A service worker that ships in the production image. next-pwa runs only under webpack and the Docker build uses Turbopack, so the build either moves the worker to a Turbopack-compatible setup or builds with webpack.
- [ ] Offline reading of the inbox and queued replies through shared-ui-lib `offline`
- [ ] English and Swahili

### Public support pages

- [ ] Shared form fields and the shared `RichTextEditor` in place of native fields and the plain textarea

## Acceptance criteria

- At 390 px and on desktop, an agent filters by a saved view, selects ten tickets and changes their status in one action.
- A second agent opening the same ticket sees the viewing warning within 2 seconds, and the typing warning while the first agent types.
- The production build serves a service worker, and the inbox opens offline after one online visit.

## Fix requirements proved

- **Fix 3, no missed duplicate replies.** The Playwright test with two agents on one ticket.
- **Fix 1, no feature behind an add-on.** The Playwright test on a tier-1 tenant that creates, assigns, comments on, merges and resolves a ticket with a macro.
- **Flip, offline and mobile-first.** The offline and 390 px checks above.
