# Ticketing UI Plan

ticketing-ui is the help desk front end for the Codevertex platform: the signed-in customer portal, the agent workspace, the admin console, the knowledge base and the public support pages. It talks only to ticketing-api for ticket data and to auth-api for sign-in, the SSO profile, tenant branding and public email codes. Every permission is enforced by the API; the UI only keeps people off screens that would fail.

## State on 2026-11-16

Commit 053c298 (on top of 0e7b392) is live in production. It delivered:

- **Profile and permissions.** A two-step profile: the SSO profile from auth-api, then the ticketing role and permissions from `GET /api/v1/{tenant}/ticketing/auth/me`.
- **Navigation.** One nav definition gating the sidebar, the mobile bottom bar and `RouteGuard` by permission. A subscription 403 shows an upgrade toast and a permission 403 shows the unauthorized page.
- **Live updates.** Server-Sent Events read with fetch and an Authorization header, reconnecting with backoff, with query keys that match the hooks.
- **API contract.** Edits use PUT. Types mirror the API DTOs and the shared pagination response, list params use the API names (`agentId`, `limit`), and KB articles load by slug.
- **shared-ui-lib v0.1.146.** Tenant branding, date formatting, `DataTable` with server paging, `SearchableCombobox` and `MultiSelectCombobox` in place of every native select, the debounced `SearchInput` with `useSearchQuery`, and the `RichTextEditor`.
- **Layout.** Ticket detail in three panes on wide screens and stacked on phones. Admin pages for SLA policies, routing rules and categories, and edit sheets for agents and teams.
- **Theme.** KPI cards in the maskani pattern and dark mode that follows the device.

## Stack

| Area | Choice |
|---|---|
| Framework | Next.js 16.3 App Router, React 19.2, TypeScript 6 |
| Styling | Tailwind CSS 4, scanning the shared-ui-lib dist through `@source` |
| Shared components | `@bengo-hub/shared-ui-lib` v0.1.146 |
| Data | TanStack Query 5, axios, Zustand for the session |
| Forms | React Hook Form with Zod |
| Charts | recharts |
| PWA | `@ducanh2912/next-pwa` and the shared `PwaInstallPrompt` (no service worker ships yet, see known issues) |
| Build | `next build` (Turbopack) in a Node 20 image with standalone output, port 3000 |

## Routes

| Route | Who | Purpose |
|---|---|---|
| `/` | everyone | Redirects to `/codevertex/...`; SSO resolves the user's own organization |
| `/[orgSlug]/tickets`, `/tickets/new`, `/tickets/[ticketId]` | `tickets.view` or `tickets.view_own`, `tickets.add` | Ticket list, create, detail |
| `/[orgSlug]/agent` | `tickets.view` | My inbox |
| `/[orgSlug]/kb`, `/kb/[slug]` | `kb.view` | Knowledge base, signed in |
| `/[orgSlug]/admin` and `/admin/analytics` | `analytics.view` | Dashboard and analytics |
| `/admin/teams`, `/admin/agents` | `teams.view`, `agents.view` or manage | Teams and agents |
| `/admin/kb`, `/admin/categories` | `kb.manage`, `categories.manage` | Knowledge base and categories |
| `/admin/sla`, `/admin/routing` | `sla.view`, `routing.view` or manage | SLA policies and routing rules |
| `/admin/sla/calendars` | `sla.view`; adding, changing and deleting need `sla.add`, `sla.change`, `sla.delete` | Business calendars: weekly hours, timezone and holidays |
| `/admin/sla/report` | `analytics.view` | SLA compliance, averages and p90 by priority and team |
| `/admin/settings` | `settings.manage` | Channels: the email forwarding address with auto-forward steps, and the WhatsApp auto-ticketing switch |
| `/[orgSlug]/unauthorized` | everyone | Permission refusal |
| `/support`, `/support/track`, `/support/tickets/[emailToken]` | no account | Public create, track and reply with email codes |

## Find, Flip, Fix (read 2026-11-16)

Vendor comparison blogs are weak evidence. Capterra and G2 review tallies are stronger evidence.

### Find: what people pay for

| Product | Price (USD per agent per month, sources disagree) | Known for | Top complaints |
|---|---|---|---|
| Zendesk | Suite Team about 55, Professional about 115; Copilot, WFM and Contact Center add-ons at 50 each; AI resolutions 1.50 to 2.00 each | Unified agent workspace, omnichannel, the largest app ecosystem | Price and add-ons, key features locked to high tiers, admin complexity, slow vendor support (Trustpilot 1.8) |
| Freshdesk | Free (2 agents), Growth from about 15, AI add-on about 29 | Collision detection from Growth, parent-child tickets on Pro, SLA with business hours, portal | G2: "missing features" (115) and "ticketing issues" (93) |
| Zoho Desk | Free (3 agents), Standard 9 to 14, Professional 16 to 23 | Cheapest, Zia AI in 40+ languages, Zoho suite integration | Steep learning curve (329 and 233 G2 mentions) |
| Help Scout | 19 to 115, partly contact-based | Simple shared-inbox email support | Costs climb unpredictably with contact volume |
| HappyFox | 21 to 24 (help desk), 49 (ITSM) | Fast setup, easy navigation | Limited automation, small integration set |
| Jira Service Management | Free (3 agents), Standard about 20, Premium about 45 | Internal IT desk, change and problem management | Learning curve, complexity, change management locked to Premium |

The baseline the leaders share: views and saved filters, collision detection, macros and canned replies, internal notes and public replies, merge, parent-child links, bulk actions, tags, @mentions; SLA with business hours, holidays, pause on pending, pre-breach alerts and escalation; CSAT, a knowledge base with real search and deflection, a customer portal; agent and SLA reports; email, chat or WhatsApp, and a web form.

### Flip: the angle for Kenya and East Africa

- WhatsApp is the first channel, not an add-on, through notifications-api.
- Pricing is in KES with no per-feature add-ons, and core ticket work is never plan-gated.
- AI through Vera is billed only from the existing prepaid AI credit wallet.
- The customer is the marketflow contact, so tickets link to orders, projects QA and invoices across the platform with no PII copy.
- The agent UI works offline, the PWA is mobile-first, and it is in English and Swahili.

### Fix: competitor complaints as testable requirements

1. **No feature behind an add-on.** A Playwright test with a tier-1 tenant creates, assigns, comments on, merges and resolves a ticket, and uses macros and SLA. UI sprints 8 and 9.
2. **Low learning curve.** Seeded defaults give a new tenant a working desk, and a Playwright test runs a fresh tenant from first ticket to resolution without opening the admin pages. UI sprint 9.
3. **No missed duplicate replies.** A Playwright test with two agents on one ticket shows the second agent the viewing and typing warning within 2 seconds. UI sprint 8.
4. **Predictable cost.** At zero AI balance the AI suggestion is hidden and the ticket still saves. UI sprint 12.
5. **Reports stay fast as data grows.** The dashboard reads only rollup endpoints that stay under 300 ms p95 at 200k tickets. UI sprint 11.

### Sources (read 2026-11-16)

- https://www.featurebase.app/blog/freshdesk-vs-zendesk-vs-zoho
- https://eesel.ai/blog/zendesk-review
- https://hiverhq.com/blog/zendesk-reviews
- https://www.capterra.com/p/164283/Zendesk/reviews/
- https://www.capterra.co.za/reviews/169505/zoho-desk
- https://www.capterra.co.za/reviews/124981/freshdesk
- https://www.g2.com/compare/freshdesk-vs-helpdesk-vs-zoho-desk
- https://www.getmacha.com/blog/freshdesk-features
- https://toolradar.com/blog/help-desk-software-comparison
- https://www.eesel.ai/blog/help-scout-review
- https://costbench.com/compare/happyfox-help-desk-vs-jira-service-management/
- https://superframeworks.com/articles/best-zendesk-alternatives

## Sprints

| Sprint | Scope | Status | What is missing |
|---|---|---|---|
| [0](sprints/sprint-0-foundations.md) | Foundations | Partial | Swahili, unit and e2e tests |
| [1](sprints/sprint-1-customer-portal.md) | Customer portal and public support pages | Partial | Attachments, shared fields on the public pages, working ticket search |
| [2](sprints/sprint-2-agent-workspace.md) | Agent workspace | Done | |
| [3](sprints/sprint-3-admin-console.md) | Admin console | Partial | Role administration, adding agents from the user directory |
| [4](sprints/sprint-4-sla-visualization.md) | SLA visualization | Partial | Inbox sorted by SLA due time |
| [5](sprints/sprint-5-knowledge-base.md) | Knowledge base | Partial | Public KB outside sign-in, category list, deflection |
| [6](sprints/sprint-6-analytics.md) | Analytics | Partial | Agent, SLA and CSAT reports, filters, export |
| [7](sprints/sprint-7-realtime.md) | Real-time updates | Partial | Toasts, unread count, push, presence |
| [8](sprints/sprint-8-agent-productivity.md) | Agent productivity, app shell and offline | Partial | @mentions (waits on shared-ui-lib v0.1.147), comment author names, keyset paging on the agents, teams and KB lists, offline inbox and queued replies, app shell, Playwright tests |
| [9](sprints/sprint-9-sla-admin.md) | SLA admin and inbox order | Partial | Calendars, policy settings, the SLA report and the paused clock are written but not yet built or tested; sort by SLA, escalation level on rows and the fresh-tenant test remain |
| [10](sprints/sprint-10-channels.md) | Channels | Partial | The settings page (forwarding address and WhatsApp switch) is written but not yet built or tested; the forwarding verify step waits on the API, and channel views, the WhatsApp composer and the widget remain |
| [11](sprints/sprint-11-analytics-csat.md) | Analytics and CSAT | Pending | Rollup-backed dashboard, CSAT, leaderboard, export |
| [12](sprints/sprint-12-ai-public-kb.md) | AI with Vera and the public KB | Pending | Suggested reply, summary, KB suggestions, deflection, public KB |

## Known issues and pending

| Item | Repo | Where it is fixed |
|---|---|---|
| GitHub reports 57 Dependabot alerts on ticketing-ui | UI | Integration review and test pass |
| The public support pages still use native form fields and a plain textarea | UI | Sprint 8 |
| The ticket response carries only `sla_policy_id`, so the SLA panel fetches the policy and its calendar to name the clock, and people without `sla.view` see no clock line | API | Open |
| Update requests cannot clear a field, because the API's `UpdateTicketRequest` uses pointers with `omitempty` | API | API sprint 9 |
| Fields the UI needs and the API lacks: stats `resolved_today` and `overdue`, previous-period figures, a tenant user directory for people not yet provisioned in ticketing, a KB category list, comment author names | API | API sprints 9 and 12 |
| The API's OTP client is not on shared-service-client, because a retried call could replay a one-time code | API | Kept as is by design |
| `tickets/handler.go` and `identity/handler.go` in ticketing-api are over 400 lines | API | API sprint 9 |
| Comments page oldest first only, so a long thread opens at its start rather than its latest reply | API | Open |
| The ticket list filters by one status at a time, so the agent queue tabs split loaded tickets in the browser | API | Open |
| Turbopack on Windows refuses the shared-ui-lib `@source` path through the pnpm junction, so local verification uses `next build --webpack` while CI builds with Turbopack on Linux | UI | Open |

## Environment

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://ticketingapi.codevertexafrica.com` | ticketing-api |
| `NEXT_PUBLIC_SSO_URL` | `https://sso.codevertexafrica.com` | SSO and auth-api |
| `NEXT_PUBLIC_SSO_CLIENT_ID` | `ticketing-ui` | OAuth client |
| `NEXT_PUBLIC_AUTH_API_URL` | empty | auth-api override |

## References

- [ticketing-api plan](../../ticketing-api/docs/plan.md)
- [ticketing-api architecture](../../ticketing-api/docs/architecture.md)
- [ticketing-api integrations](../../ticketing-api/docs/integrations.md)
