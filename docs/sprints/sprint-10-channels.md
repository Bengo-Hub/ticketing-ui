# Sprint 10: Channels

**Status: Partial, settings written and not yet built or tested.** It consumes [API sprint 11](../../../ticketing-api/docs/sprints/sprint-11-channels.md). The Channels section of the settings page is in place on `GET` and `PUT /{tenant}/settings/channels`. Type-check, lint, the build and the Playwright tests have not run yet. The forwarding verify step waits on the API, and the channel views, the WhatsApp composer and the widget are still open.

## Tasks

- [x] Settings page replaces the placeholder with a Channels section, behind `ticketing.settings.manage`
- [x] Email: the tenant's forwarding address (`<slug>@support.codevertexafrica.com`, or `support@codevertexafrica.com` for the platform tenant) with a copy button, short auto-forward steps for Gmail, Outlook and cPanel, and a note that replies go out from the platform and customers reply to the ticket email. When the API returns no address the card says email intake is not available yet
- [ ] Email verify button that sends a test email and shows when it arrives. The API has no verify step yet, so the page shows no delivery status
- [x] WhatsApp: the auto-ticketing switch (`whatsapp.auto_ticket`, off by default), saved as soon as it is flipped, explaining that messages to the business number join an open WhatsApp ticket from the same customer and that with the switch off only messages on an already open ticket are added
- [ ] Note that the notifications inbox keeps its Convert to ticket action, once that action exists in notifications-api
- [ ] Channel badge and channel filter on lists; WhatsApp and email threads rendered in the conversation
- [ ] Composer on a WhatsApp ticket shows whether the 24-hour window is open and offers templates outside it
- [ ] Embeddable web widget on the public create with email codes
- [x] Every new string is in `messages/en.json` and `messages/sw.json`

## Acceptance criteria

- A tenant admin copies the forwarding address, sends the verify email and sees it confirmed. Copying is written; the verify step waits on the API.
- A WhatsApp ticket shows its messages in order with the channel badge. Not started.

## Gaps in the API

- No forwarding verify step, so the page cannot say whether forwarding works.
- Gmail asks to confirm a new forwarding address by mail, and the Gmail steps tell the tenant to look for that message as a new ticket. That holds only once email-provisioner publishes inbound mail and the confirmation passes the ingest rules, which has not been tested.
- WhatsApp intake waits on notifications-api publishing `notifications.whatsapp.tenant_inbound`, so the switch has no effect until that ships.

## Fix requirements proved

- **Flip, WhatsApp first.** WhatsApp intake is a toggle on every plan, with no add-on.
