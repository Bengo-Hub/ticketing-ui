# Sprint 10: Channels

**Status: Pending.** It consumes [API sprint 11](../../../ticketing-api/docs/sprints/sprint-11-channels.md).

## Tasks

- [ ] Settings page replaces the placeholder with a Channels section
- [ ] Email: the tenant's forwarding address `<slug>@support.codevertexafrica.com`, the steps to auto-forward their support mailbox, and a verify button that sends a test email and shows when it arrives
- [ ] WhatsApp: the auto-ticketing toggle (`channels.whatsapp.auto_ticket`, off by default) with a note that the notifications inbox keeps its Convert to ticket action
- [ ] Channel badge and channel filter on lists; WhatsApp and email threads rendered in the conversation
- [ ] Composer on a WhatsApp ticket shows whether the 24-hour window is open and offers templates outside it
- [ ] Embeddable web widget on the public create with email codes

## Acceptance criteria

- A tenant admin copies the forwarding address, sends the verify email and sees it confirmed.
- A WhatsApp ticket shows its messages in order with the channel badge.

## Fix requirements proved

- **Flip, WhatsApp first.** WhatsApp intake is a toggle on every plan, with no add-on.
