# Sprint 12: AI with Vera and the Public Knowledge Base

**Status: AI and the public KB written on 2026-11-17, not yet built or deployed.** It consumes [API sprint 13](../../../ticketing-api/docs/sprints/sprint-13-ai-vera.md) and follows the contract in [ticketing-api docs/ai.md](../../../ticketing-api/docs/ai.md).

## Tasks

- [x] Suggested reply in the composer (written)
- [x] AI summary on the ticket detail (written)
- [x] Suggested KB articles on the ticket detail, with a link insert for public articles (written)
- [x] Draft a private KB article from a resolved or closed ticket (written)
- [x] Classification suggestion on the signed-in create form, applied only when the agent asks for it (written)
- [x] The auto-classify switch in admin settings (written)
- [x] A refresh of the ticket and the lists on the `ticket.ai_classified` event (written)
- [x] Out of AI credits or AI unavailable shows a short note under that one button, with the ticket action unaffected (written)
- [x] A public knowledge base outside the signed-in layout, with rich text rendering (written)
- [x] KB deflection on the public support form and the embedded widget (written)
- [x] The staff KB list on the keyset API (written)

## How the public knowledge base works

The help center lives at `/support/kb?org=<slug>` (`tenant` is also read, as on the track page), inside the public support layout, with no sign-in. It reads ticketing-api's public KB routes ([integrations.md](../../../ticketing-api/docs/integrations.md#public-routes)) through `src/lib/api/public-kb.ts`, with plain fetch so a signed-in user's token never goes with a public call. The API only returns the tenant's published, public articles.

- **List.** `HelpCenterList` (shared with the signed-in `/[orgSlug]/kb`): debounced search, category chips from `GET /kb/categories` with counts, keyset pages with "Load more". A link without a known organisation shows a short note instead of a list.
- **Article.** `/support/kb/<slug>?org=<slug>` is a server page: it reads the article once, sets the page title, description, canonical link and Open Graph, and lets search engines index it (`index, follow`); a missing, draft or private article is `noindex`. The client view (`HelpArticle`, shared with `/[orgSlug]/kb/[slug]`) takes the server's copy as its initial data, so a visit counts one view. The body is the HTML the API sanitised on save, shown through `RichTextView`'s allow-list. One helpful or not helpful vote per page view; the counts update in place.
- **Deflection.** `KbDeflection` sits under the subject on the public form and so in the widget too. Once typing pauses on a subject of five or more characters, it asks `GET /kb/suggestions` (a plain search, no AI and no credits) and shows up to five articles with their excerpts. Articles open in a new tab, so the form keeps what was typed and the widget never tries to frame the help center. "This answered my question" counts a helpful vote and ends the flow without a ticket, with "I still need help" back to the filled form. It only searches the organisation the link named and auth-api found.
- **Links.** The public form offers "Browse the help center" when the organisation is known, and the article and list pages lead back to `/support?org=`.
- **Strings.** Under `helpCenter` in `messages/en.json` and `messages/sw.json`. The Swahili strings are mine and still need the owner's review.

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

- A visitor without an account reads a public article, and a draft or private article is not found.
- Typing a subject on the public form or the widget shows matching public articles, and "This answered my question" sends no ticket.
- A tenant at zero AI balance sees "Out of AI credits" under the button it pressed and still saves tickets and replies.
- A retry after a 503 sends the same `Idempotency-Key` as the failed click; a new click sends a new one.
- A suggested reply is never posted until the agent sends it.

## Fix requirements proved

- **Fix 4, predictable cost.** The zero-balance check above, alongside the API unit test.
