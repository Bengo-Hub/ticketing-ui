# Sprint 12: AI with Vera and the Public Knowledge Base

**Status: AI written on 2026-11-17, not yet built or deployed. Public KB pending.** It consumes [API sprint 13](../../../ticketing-api/docs/sprints/sprint-13-ai-vera.md) and follows the contract in [ticketing-api docs/ai.md](../../../ticketing-api/docs/ai.md).

## Tasks

- [x] Suggested reply in the composer (written)
- [x] AI summary on the ticket detail (written)
- [x] Suggested KB articles on the ticket detail, with a link insert for public articles (written)
- [x] Draft a private KB article from a resolved or closed ticket (written)
- [x] Classification suggestion on the signed-in create form, applied only when the agent asks for it (written)
- [x] The auto-classify switch in admin settings (written)
- [x] A refresh of the ticket and the lists on the `ticket.ai_classified` event (written)
- [x] Out of AI credits or AI unavailable shows a short note under that one button, with the ticket action unaffected (written)
- [ ] A public knowledge base outside the signed-in layout, with rich text rendering
- [ ] KB deflection on the public support form (the signed-in create form already has it)

## How the AI features work in the UI

Every AI button sits beside the ticket work and never in its way. Ticket create, update and reply never wait on AI.

- **Request keys.** Each click sends a new `Idempotency-Key`. "Try again" after a failure resends the key of that click, so an answer the API already paid for comes back without a second charge (`useAiAction` in `src/hooks/useAI.ts`).
- **Cost line.** Before a request the button says it uses 1 AI credit. After it, the line says what the answer cost, or that a repeat was not charged again. The platform owner and any answer marked `exempt` see no cost line.
- **Errors.** A 402 shows "Out of AI credits" with a link to subscriptions-ui's billing page, where AI credits are bought. A 503 shows "AI is unavailable, try again" with a retry. A 409 on a KB draft says to resolve the ticket first. Each error stays under its own button.
- **Advice.** `review_notes` show as a "Check before sending" list beside the suggested reply, the summary, the suggestions and the draft. `tainted` adds a warning that the text came from untrusted ticket content. A run that stopped early says the text may be incomplete. None of these block using the text.
- **Suggested reply.** It fills the editor as a public reply, after anything already typed, and is never sent on its own. The agent edits it and sends it like any reply.
- **Suggested articles.** A public article can be linked into the reply. A private article is marked staff only and is never offered for a reply.
- **KB draft.** Shown only on a resolved or closed ticket. The draft is saved private and unpublished; the panel links to it in the KB editor for people who manage the knowledge base.
- **Classify.** On the signed-in create form, "Suggest category and priority" selects both and the agent can change them. `requires_human_review` shows as a note. When `injected` is true nothing is selected and the agent chooses.
- **Auto-classify.** Admin settings has an AI card with the `auto_classify` switch, off by default, explaining that each new ticket uses 1 AI credit.

## Permissions

| Action | Shown when the person holds |
|---|---|
| Summarize | `ticketing.tickets.view` |
| Suggest reply | `ticketing.tickets.view` and `ticketing.comments.add` |
| Suggested articles | `ticketing.tickets.view` and `ticketing.kb.view` |
| Draft KB article | `ticketing.tickets.view` and `ticketing.kb.add` |
| Suggest category and priority | `ticketing.tickets.view` and `ticketing.tickets.add` |
| AI settings | `ticketing.settings.manage` |

Customers hold only `ticketing.tickets.view_own`, so they never see an AI button.

## Acceptance criteria

- A visitor without an account reads a public article.
- A tenant at zero AI balance sees "Out of AI credits" under the button it pressed and still saves tickets and replies.
- A retry after a 503 sends the same `Idempotency-Key` as the failed click; a new click sends a new one.
- A suggested reply is never posted until the agent sends it.

## Fix requirements proved

- **Fix 4, predictable cost.** The zero-balance check above, alongside the API unit test.
