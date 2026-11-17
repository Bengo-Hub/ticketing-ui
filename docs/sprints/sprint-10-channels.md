# Sprint 10: Channels

**Status: Partial, written and not yet built or tested.** It consumes [API sprint 11](../../../ticketing-api/docs/sprints/sprint-11-channels.md). The settings page, the channel badge and filter, the WhatsApp window in the composer, the forwarding status and the web widget are all written. Type-check, lint, the build and the Playwright tests have not run yet. The threaded WhatsApp and email rendering and the notifications inbox note were added on 17 November 2026, also not yet built. WhatsApp templates outside the window remain.

## Tasks

- [x] Settings page replaces the placeholder with a Channels section, behind `ticketing.settings.manage`
- [x] Email: the tenant's forwarding address (`<slug>@support.codevertexafrica.com`, or `support@codevertexafrica.com` for the platform tenant) with a copy button, short auto-forward steps for Gmail, Outlook and cPanel, and a note that replies go out from the platform and customers reply to the ticket email. When the API returns no address the card says email intake is not available yet
- [x] Email forwarding status from `email.last_received_at` on the channel settings. While it is null the card says it is waiting for the first forwarded email and asks for a test email to the support mailbox, with a Refresh button that reloads the settings. Once set it says Working with the time of the last forwarded email. There is no send-a-test button: the tenant sends the test from their own mailbox, which is what proves the forward
- [x] The platform tenant, whose address is `support@codevertexafrica.com` itself, sees the address as its support mailbox with no forwarding steps, since that mailbox receives directly
- [x] WhatsApp: the auto-ticketing switch (`whatsapp.auto_ticket`, off by default), saved as soon as it is flipped, explaining that messages to the business number join an open WhatsApp ticket from the same customer and that with the switch off only messages on an already open ticket are added
- [x] Note that the notifications inbox keeps its Convert to ticket action: the WhatsApp card says staff can turn any message into a ticket from the notifications app's WhatsApp inbox, and that a message only ever opens one ticket
- [x] Channel badge (icon and label per channel) in the inbox channel column and in the ticket header. Below the lg breakpoint, where the channel column is hidden, each row keeps the channel as an icon next to the ticket number
- [x] Channel filter in the inbox filters, sent as `?channel=` and part of the list query key and saved views
- [x] WhatsApp and email threads rendered as such in the conversation. A customer message that came in by email or WhatsApp shows the channel icon and the sender (name with email or phone), and an email shows the subject the customer wrote under as a quote. The original request of an email or WhatsApp ticket shows the channel and the requester the same way. For staff, an agent's public reply on an email or WhatsApp ticket says it was sent by email to the requester, or that it was not sent because the ticket has no email address; on a WhatsApp ticket a tooltip adds that replies do not go out on WhatsApp yet (owner decision of 17 November 2026). The fields come from ticketing-api's comment DTO (`channel`, `sender`, `email_subject`).
- [x] Composer on a WhatsApp ticket shows staff whether the 24-hour window is open and when it closes, as a countdown that refreshes every 30 seconds from a shared clock store (no effect sets state). In the last hour it turns amber. Once closed, or when the ticket has no window yet, it warns that a free-form reply will not reach WhatsApp and says whether the reply still goes by email (the requester has an email in `requester_email`, or `customer_email` on older tickets) or reaches the customer only when they write again. Internal notes hide the banner
- [ ] Offer WhatsApp templates outside the window
- [x] Embeddable web widget at `/support/widget?tenant=<slug>&theme=light|dark`: the public create-ticket flow, email code included, in a compact frame with the language switch. The flow now lives in one component, `CreateTicketForm`, used by both `/support` and the widget. Tracking links open the full support site in a new tab
- [x] `public/widget.js`, a dependency-free loader: a floating help button that opens the widget in an iframe panel (380 by 640 pixels on wide screens, full screen under 480 pixels), with a close button, Escape to close and the iframe loaded only on the first open. Script tag options: `data-tenant`, `data-theme`, `data-position`, `data-label`, `data-color`
- [x] A Web widget card on the settings page with the embed snippet, a copy button, the three install steps, the optional attributes and a link to open the widget form
- [x] `next.config.ts` sends `Content-Security-Policy: frame-ancestors *` on `/support/widget` only. No other route sets a framing header, before or after this change
- [x] Every new string is in `messages/en.json` and `messages/sw.json`

## How the pieces fit

- The public support routes now sit in two branches. `src/app/support/layout.tsx` only provides the query client. The full pages (create, track and old ticket links) moved into the `(site)` route group, whose layout carries the support header; their URLs did not change. `/support/widget` has its own compact layout and is marked noindex.
- The widget's `theme` param goes through a small store in `src/lib/forced-theme.ts`, which the root `ThemeProvider` passes to next-themes as `forcedTheme`. This leaves the visitor's saved theme untouched, as next-themes' `setTheme` would have written it.
- The WhatsApp countdown and similar clocks read `useNow` (`src/hooks/useNow.ts`), a shared 30 second clock on `useSyncExternalStore`. The server and the hydrating render see 0, and the banner then shows only the closing time.
- `CopyButton` (`src/components/common/copy-button.tsx`) now serves both the forwarding address and the widget snippet.

## Acceptance criteria

- A tenant admin copies the forwarding address, sends a test email and sees the card change to Working. Written; waits on the API's `last_received_at`.
- A WhatsApp ticket shows the channel badge and, for staff, the window state above the reply. Written, threaded rendering included; not yet built.
- A tenant pastes the snippet on their site, opens the help button, confirms their email with the code and raises a ticket. Written; not yet tried on a real host page.

## Gaps in the API

- `email.last_received_at` and `whatsapp_window_expires_at` are coded against the agreed contract and are being built in parallel. Until they ship, the email card stays on Waiting and a WhatsApp ticket shows the window as not open.
- Gmail asks to confirm a new forwarding address by mail, and the Gmail steps tell the tenant to look for that message as a new ticket. That holds only once email-provisioner publishes inbound mail and the confirmation passes the ingest rules, which has not been tested.
- WhatsApp intake waits on notifications-api publishing `notifications.whatsapp.tenant_inbound`, so the switch has no effect until that ships.

## Open points

- The rest of the app still sends no framing header at all, so any site can frame the signed-in pages. I want to add `frame-ancestors 'self'` for every route except the widget in a separate change, after checking that nothing frames the app today.
- Escape only closes the panel while focus is on the host page. Once focus is inside the iframe the key stays there; the close button still works.

## Fix requirements proved

- **Flip, WhatsApp first.** WhatsApp intake is a toggle on every plan, with no add-on, and agents see the WhatsApp window before they reply.
