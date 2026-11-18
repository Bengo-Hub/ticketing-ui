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

## Written on 2026-11-17, not yet built or deployed

[Sprint 12](sprints/sprint-12-ai-public-kb.md) adds AI with Vera on ticketing-api's `/ai` routes ([contract](../../ticketing-api/docs/ai.md)):

- **Ticket detail.** Summarize, Suggest reply in the composer (it fills the editor and is never sent on its own), Suggested articles with a link insert for public articles, and Draft KB article on a resolved or closed ticket, which saves a private draft and links to it in the KB editor.
- **Create form.** Suggest category and priority preselects both on the signed-in form; the agent can change them, and a draft that tried to instruct the AI preselects nothing.
- **Cost and errors.** Each click sends a new `Idempotency-Key` and a retry reuses it. A cost line says 1 AI credit and disappears for the platform owner. Out of credits links to subscriptions-ui's billing page and AI unavailable offers a retry, each under its own button.
- **Settings and live updates.** An AI card in admin settings holds the auto-classify switch, off by default. The `ticket.ai_classified` event refreshes the ticket and the lists.

Settings out of code (owner decision 2026-11-17):

- **CSAT card.** Admin settings has a Customer satisfaction section with the survey switch (on by default, saved when flipped) and how many days the survey link works (1 to 30, default 7, saved with its own button), on ticketing-api's `GET` and `PUT /{tenant}/settings/csat` (`settings.manage`).
- **Help center card, platform owner only.** A "Platform: help center" section shows when the signed-in profile is the platform owner (`is_platform_owner`, not a tenant superuser): the article page cache in seconds (0 to 3600, default 60) and the public KB limits (reads 120 a minute, suggestions 60 a minute, view counts 60 a minute, votes 30 an hour, each 1 to 10000), on `GET` and `PUT /{tenant}/platform/settings/help-center`. The values apply to every tenant's help center.
- **Article cache time from the API.** `src/lib/api/public-kb-server.ts` reads `article_cache_seconds` from the public `GET /{org}/kb/config` and keeps it for 5 minutes on the UI server; 0 turns the article cache off. While the API cannot be read the page uses 60 seconds and logs a warning. The number lives only in ticketing-api.
- **Swahili strings** for both cards are in `messages/sw.json` under `settings.csat` and `settings.helpCenter`, for the owner's review.

[Sprint 13](sprints/sprint-13-auth-and-roles.md) ports treasury-ui's sign-in flow and its people and roles screens:

- **Sign-in flow.** The session store now uses Zustand's persist middleware under `ticketing-auth-storage`, the same shape as treasury-ui. A refresh or `/me` that auth-api refuses clears the session, and the app sends the person to SSO sign-in exactly once. The guard renders one neutral loader until the saved session is restored, so the server and the first client render always match (this fixes React error 418).
- **People and roles.** `/admin/settings/team` and `/admin/settings/roles`, gated by `ticketing.rbac.view` or `ticketing.rbac.manage`, on ticketing-api's new role endpoints under `/api/v1/{tenant}/ticketing`.

[Sprint 11](sprints/sprint-11-analytics-csat.md) moves every count and chart onto ticketing-api's rollup routes and adds the CSAT survey:

- **Old routes gone.** The API removed `GET /tickets/stats` and `GET /tickets/analytics`, and nothing in the UI calls them now. The dashboard, the agent inbox cards and the analytics page read `/api/v1/{tenant}/analytics/{tickets,agents,sla,csat}`, and the change against the previous period comes from the API.
- **Analytics.** `/admin/analytics` has Tickets, Agents, SLA and CSAT views with KPI cards, trend charts, every breakdown the API returns, filters for dates, team, agent, category, channel and priority in the address bar, the browser's time zone, and PDF, CSV and XLSX exports of the same query.
- **CSAT survey.** `/support/csat?tenant=&token=` (optional `&score=`) checks the survey token, shows the ticket and takes a rating from 1 to 5 with an optional comment. Already answered, expired and unknown links each get their own message.

The carry-over of sprints 4, 8 and 9 reads the fields and orders of ticketing-api's sprint 9 carry-over:

- **SLA due inbox.** Staff open `/tickets` and the agent queue nearest SLA target first (`sort=sla_due`), with an order control for SLA due first, newest first and oldest first. Customers keep the two date orders.
- **SLA panel.** It names the policy beside the SLA title and the calendar or 24x7 under the timers, from `sla_policy_name` and `sla_calendar_name` on the ticket, for everyone who sees the ticket.
- **Comment author names.** Each message shows the author's name from `author_name`, with the role beside it.
- **Agents and teams on keyset.** `/admin/agents` and `/admin/teams` page newest first with "Load more"; pickers read the first page of 100 and list names alphabetically.

## Stack

| Area | Choice |
|---|---|
| Framework | Next.js 16.3 App Router, React 19.2, TypeScript 6 |
| Styling | Tailwind CSS 4, scanning the shared-ui-lib dist through `@source` |
| Shared components | `@bengo-hub/shared-ui-lib` v0.1.148 |
| Data | TanStack Query 5, axios, Zustand with its persist middleware for the session |
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
| `/[orgSlug]/admin` | `analytics.view` | Dashboard: live ticket counts, the last seven days against the seven before, agents and teams |
| `/admin/analytics?view=&from=&to=&team=&agent=&category=&channel=&priority=` | `analytics.view` | Tickets, Agents, SLA and CSAT analytics from the rollup routes, with PDF, CSV and XLSX export |
| `/admin/teams`, `/admin/agents` | `teams.view`, `agents.view` or manage | Teams and agents |
| `/admin/kb`, `/admin/categories` | `kb.manage`, `categories.manage` | Knowledge base and categories |
| `/admin/sla`, `/admin/routing` | `sla.view`, `routing.view` or manage | SLA policies and routing rules |
| `/admin/sla/calendars` | `sla.view`; adding, changing and deleting need `sla.add`, `sla.change`, `sla.delete` | Business calendars: weekly hours, timezone and holidays |
| `/admin/sla/report` | `analytics.view` | SLA compliance, averages and p90 by priority and team |
| `/admin/settings` | `settings.manage` | Channels: the email forwarding address with auto-forward steps and its Waiting or Working status, the WhatsApp auto-ticketing switch, and the web widget embed snippet; the AI auto-classify switch; the CSAT survey switch and link validity; for the platform owner only, the help center limits and article cache |
| `/admin/settings/team` | `rbac.view`; adding people and giving or taking roles need `rbac.manage` | Users: everyone in the tenant with their roles, add a person by email, give a role (optionally until a date) and take one away |
| `/admin/settings/roles` | `rbac.view`; every change needs `rbac.manage` | Roles: default and custom roles, create, copy, customise, rename, delete, the permission matrix by module and the 30 day change log |
| `/[orgSlug]/auth/callback` | everyone | SSO code exchange; errors use the shared `SSOCallbackError` card |
| `/[orgSlug]/unauthorized` | everyone | Permission refusal |
| `/support`, `/support/track`, `/support/tickets/[emailToken]` | no account | Public create (with KB deflection as the subject is typed), track and reply with email codes |
| `/support/widget?tenant=<slug>&theme=` | no account | The public create flow in a compact frame for `public/widget.js`, with the same KB deflection; the only route any site may frame |
| `/support/kb?org=<slug>`, `/support/kb/[slug]?org=<slug>` | no account | The public help center: published public articles with search, categories and votes; articles are indexed by search engines |
| `/support/csat?tenant=<tenant id>&token=<token>&score=` | no account | The CSAT survey from the resolved-ticket email; `score` is optional and preselects a rating |

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
| [3](sprints/sprint-3-admin-console.md) | Admin console | Partial | Adding agents from the user directory (role administration moved to sprint 13) |
| [4](sprints/sprint-4-sla-visualization.md) | SLA visualization | Partial | The SLA due inbox order and the policy name on the panel are written, not yet built or deployed |
| [5](sprints/sprint-5-knowledge-base.md) | Knowledge base | Written, not built | Build and a check against the deployed API |
| [6](sprints/sprint-6-analytics.md) | Analytics | Replaced | Rebuilt on the rollup routes in sprint 11 |
| [7](sprints/sprint-7-realtime.md) | Real-time updates | Partial | Toasts, unread count, push, presence |
| [8](sprints/sprint-8-agent-productivity.md) | Agent productivity, app shell and offline | Partial | @mentions (waits on shared-ui-lib v0.1.147), offline inbox and queued replies, app shell, Playwright tests; comment author names and keyset paging on the agents and teams lists are written, not yet built |
| [9](sprints/sprint-9-sla-admin.md) | SLA admin and inbox order | Partial | Calendars, policy settings, the SLA report and the paused clock are written but not yet built or tested, and so is the SLA due inbox order (2026-11-17); escalation level on rows and the fresh-tenant test remain |
| [10](sprints/sprint-10-channels.md) | Channels | Partial | Settings with the forwarding status, the channel badge and filter, the WhatsApp window in the composer and the web widget are written but not yet built or tested; WhatsApp templates, threaded channel rendering and the notifications inbox note remain |
| [11](sprints/sprint-11-analytics-csat.md) | Analytics and CSAT | Written | Type-check, lint and build; a check of every view and export against the deployed API; a real survey email rated once and refused the second time |
| [12](sprints/sprint-12-ai-public-kb.md) | AI with Vera and the public KB | Written, not built | AI features, the public help center and deflection on the public form and widget are written; build, a check against the deployed API, and the owner's review of the Swahili strings remain |
| [13](sprints/sprint-13-auth-and-roles.md) | Sign-in flow, users and roles | Written | Type-check, lint and build; a check against the new ticketing-api role endpoints; the two sign-in fixes confirmed in production |

## Known issues and pending

| Item | Repo | Where it is fixed |
|---|---|---|
| GitHub reports 57 Dependabot alerts on ticketing-ui | UI | Integration review and test pass |
| The public support pages still use native form fields and a plain textarea | UI | Sprint 8 |
| The ticket response carried only `sla_policy_id`, so the SLA panel fetched the policy and its calendar to name the clock, and people without `sla.view` saw no clock line | API | Written 2026-11-17: the ticket carries `sla_policy_name` and `sla_calendar_name`, and the panel no longer fetches the calendar |
| Update requests cannot clear a field, because the API's `UpdateTicketRequest` uses pointers with `omitempty` | API | API sprint 9 |
| Fields the UI needs and the API lacks: a tenant user directory for people not yet provisioned in ticketing (comment author names arrived as `author_name` and the KB category list as `GET /kb/categories`, both written 2026-11-17). Stats `resolved_today` and `overdue` and previous-period figures arrived with the API's analytics routes | API | API sprints 9 and 12 |
| ticketing-api's `kb.Article` had no JSON tags, so the KB routes sent Go field names (`ID`, `Title`, `IsPublic`) | API | Fixed 2026-11-17: snake_case tags on `kb.Article`, and the public routes send the slimmer `kb.PublicArticle` |
| The KB editor at `/admin/kb/{id}` is gated by `ticketing.kb.manage`, so someone holding only `ticketing.kb.add` can draft an article with AI but cannot open it | UI | Open |
| The API's OTP client is not on shared-service-client, because a retried call could replay a one-time code | API | Kept as is by design |
| `tickets/handler.go` and `identity/handler.go` in ticketing-api are over 400 lines | API | API sprint 9 |
| Comments page oldest first only, so a long thread opens at its start rather than its latest reply | API | Open |
| The ticket list filters by one status at a time, so the agent queue tabs split loaded tickets in the browser | API | Open |
| No route other than `/support/widget` sent a framing header, and neither does the ingress, so any site could frame the signed-in app | UI | Fixed 2026-11-17: every other route sends `frame-ancestors 'self'` and `X-Frame-Options: SAMEORIGIN` (next.config.ts) |
| A browser holding a session auth-api refused stayed on "Initializing session..." while `/me` was called again and again, and the sign-in guard rendered different text on the server and in the browser (React error 418) | UI | Written 2026-11-17 in sprint 13, not yet deployed |
| Turbopack on Windows refuses the shared-ui-lib `@source` path through the pnpm junction, so local verification uses `next build --webpack` while CI builds with Turbopack on Linux | UI | Open |
| The AI cost line before a request says 1 AI credit (`ai.usesCredit`, `ai.settings.cost`), but the API now charges each feature's price from marketflow-ai's registry; the answer's `credits.charged` is already the real figure | UI and API | Open: the API has no read of a feature's price before the call yet |
| The new CSAT and help center cards have no automated UI test; the repo has only the Playwright Fix tests, whose mocks do not model the settings routes | UI | Open |
| The help center article page read the article on the UI server with no cache, so every visitor's read reached ticketing-api from the UI server's IP and shared one rate limit bucket (120 a minute per tenant on that route, 300 a minute globally); a busy article or a crawler could make the page fail for everyone | UI and API | Written 2026-11-17, not yet deployed: see "Help center reads" below |

### Help center reads

`/support/kb/[slug]` reads the article through `src/lib/api/public-kb-server.ts`:

- **Page cache.** The article is kept in Next's data cache for the platform setting `article_cache_seconds` (60 seconds by default, read from ticketing-api's `GET /{org}/kb/config` and kept 5 minutes; 0 turns the cache off) under the tenant and slug only, so repeat views and crawlers mostly never reach ticketing-api. Only a 200 is kept; a 404, 429 or error answers that visit and is asked again on the next one. The cache lives on each UI pod, so with two pods an article is read at most twice per cache period. An edit or unpublish shows on the public page within the cache period.
- **The visitor's own bucket.** The read behind a cache miss sends the visitor's IP in `X-Visitor-IP` and the shared `VISITOR_IP_FORWARD_KEY` in `X-Visitor-IP-Key`. The IP is the `X-Real-IP` the ingress in front of ticketing-ui set from Cloudflare's `CF-Connecting-IP`, which a browser cannot choose. ticketing-api trusts `X-Visitor-IP` only with the matching key and otherwise ignores it ([integrations](../../ticketing-api/docs/integrations.md), Client IP and the help center's server-side reads). With no key set, the header is not sent and reads fall back to the UI server's bucket, which the cache keeps small.
- **Views.** The cached read asks with `count_view=false`, so a cache miss is not a view. The page then counts one view from the visitor's browser with `POST /api/v1/{tenant}/kb/articles/{id}/view`, once per page view. Crawlers that do not run scripts are not counted, and the view count on the page can be up to a minute old. When the server could not read the article, the browser reads it again itself and that read counts the view.

## Environment

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://ticketingapi.codevertexafrica.com` | ticketing-api |
| `NEXT_PUBLIC_SSO_URL` | `https://sso.codevertexafrica.com` | SSO and auth-api |
| `NEXT_PUBLIC_SSO_CLIENT_ID` | `ticketing-ui` | OAuth client |
| `NEXT_PUBLIC_AUTH_API_URL` | empty | auth-api override |
| `VISITOR_IP_FORWARD_KEY` | empty | Server only, a secret of at least 32 characters, the same value as ticketing-api's. Lets the help center's server-side reads be limited per visitor. Empty sends no visitor IP |
| `API_INTERNAL_URL` | empty | Server only. The in-cluster ticketing-api URL for the help center's server-side reads, so they do not loop out through Cloudflare. Empty uses `NEXT_PUBLIC_API_URL` |

## References

- [ticketing-api plan](../../ticketing-api/docs/plan.md)
- [ticketing-api architecture](../../ticketing-api/docs/architecture.md)
- [ticketing-api integrations](../../ticketing-api/docs/integrations.md)
