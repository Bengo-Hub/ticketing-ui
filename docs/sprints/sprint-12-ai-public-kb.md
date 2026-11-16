# Sprint 12: AI with Vera and the Public Knowledge Base

**Status: Pending.** It consumes [API sprint 13](../../../ticketing-api/docs/sprints/sprint-13-ai-vera.md).

## Tasks

- [ ] Suggested reply in the composer
- [ ] AI summary on long threads
- [ ] Suggested KB articles on the ticket detail
- [ ] Classification suggestion on create, applied only when the agent accepts it
- [ ] Every AI element hidden when the tenant's AI credit is at zero, with the ticket action unaffected
- [ ] A public knowledge base outside the signed-in layout, with rich text rendering
- [ ] KB deflection on the public support form and the signed-in create form as the subject is typed

## Acceptance criteria

- A visitor without an account reads a public article.
- A tenant at zero AI balance sees no AI suggestion and still saves tickets and replies.

## Fix requirements proved

- **Fix 4, predictable cost.** The zero-balance Playwright check above, alongside the API unit test.
