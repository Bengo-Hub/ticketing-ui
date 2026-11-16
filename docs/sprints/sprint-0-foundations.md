# Sprint 0: Foundations

**Status: Partial.** The app, SSO sign-in, the two-step profile, permission-gated navigation and shared-ui-lib v0.1.146 are in place and live (0e7b392 and 053c298). Swahili, unit tests and e2e tests are not built.

## Tasks

- [x] Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, TanStack Query, Zustand, React Hook Form with Zod
- [x] Tenant routes under `/[orgSlug]`; the root page redirects to `/codevertex/...` and SSO resolves the user's own organization
- [x] SSO sign-in with PKCE and token refresh (`src/lib/auth`)
- [x] `useMe` reads the SSO profile from auth-api `/api/v1/auth/me`
- [x] `useServicePermissions` reads the ticketing role and permissions from `GET /api/v1/{tenant}/ticketing/auth/me`, and infers the role from global roles while the service has not provisioned the user (404)
- [x] One nav definition (`src/lib/nav.ts`) drives the sidebar, the mobile bottom bar and `RouteGuard`; a person without a page's permission goes to `/[orgSlug]/unauthorized`
- [x] The UI permission check applies the API's rules: `manage` covers a module, an action covers its `_own` variant
- [x] A subscription 403 shows an upgrade toast; only a permission 403 leads to the unauthorized page
- [x] shared-ui-lib v0.1.146: tenant branding from `/tenant`, dates from `/format`, shared tables, pickers, search and editor
- [x] Dark mode follows the device, with a header toggle
- [x] ESLint flat config as in pos-ui
- [ ] English and Swahili (sprint 8)
- [ ] Vitest unit tests and Playwright e2e tests

## Acceptance criteria

- An agent never sees the admin sidebar items and gets the unauthorized page on a direct admin URL. Met.
- A tenant without an active subscription can read tickets and sees an upgrade prompt on a write. Met.
