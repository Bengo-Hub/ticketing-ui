# Sprint 1: Customer Portal

**Status: Partial.** Signed-in ticket list, create and detail are built on the shared components. The public support pages work and still use native fields and a plain textarea. Attachments are missing.

## Tasks

### Signed in

- [x] `/[orgSlug]/tickets`: shared `DataTable` with server paging, `SearchableCombobox` filters, debounced `SearchInput` through `useSearchQuery`, which aborts older requests
- [x] `/[orgSlug]/tickets/new`: React Hook Form with Zod, `RichTextEditor` for the description
- [x] `/[orgSlug]/tickets/[ticketId]`: conversation, properties and SLA; customers see only their own tickets and never internal notes (the API enforces it)
- [x] Edits use PUT, as the API defines
- [ ] Ticket search returns matches. The UI sends `search` and the API does not read it yet (API sprint 9).
- [ ] Attachments (sprint 8, with API sprint 9)

### Public support pages

- [x] `/support`: pick the organization, verify the email with a six-digit code from auth-api, open a ticket with `X-OTP-Token`
- [x] `/support/track`: track a ticket by number with one code, through a ticket access token
- [x] `/support/tickets/[emailToken]`: read and reply
- [ ] Shared form fields and the shared editor in place of native fields and the plain textarea (sprint 8)

## Acceptance criteria

- A customer opens a ticket and sees it in their list with its number. Met.
- A visitor without an account opens and tracks a ticket by email code. Met.
