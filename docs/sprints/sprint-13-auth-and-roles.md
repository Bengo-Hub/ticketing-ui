# Sprint 13: Sign-in Flow, Users and Roles

**Status: Written, not yet built or deployed.** It ports treasury-ui's sign-in flow and its Team and Roles screens, and consumes ticketing-api's role management endpoints under `/api/v1/{tenant}/ticketing`, built to treasury-api's contract.

## Why

Two production faults came from the old sign-in code.

1. A browser holding a session auth-api had already refused (the refresh answered 401, then `/me` answered 401) stayed on "Initializing session..." while `/me` was called again and again. The store read the 401 from `/me` as a network error, because it only recognised axios errors, so it marked the session as signed in. The guard then hid the page while `/me` loaded; every time the page came back, a newly mounted component asked TanStack Query for `/me` again, the failed query was fetched once more, the guard hid the page, and the cycle repeated.
2. React error 418. The store read localStorage when its module loaded, so the server rendered "Redirecting to sign-in..." while a browser with a saved session rendered "Initializing session..." on its first pass.

## Tasks

- [x] Session store on Zustand's persist middleware under `ticketing-auth-storage`, as in treasury-ui. The old hand-written `lib/auth/session.ts` is gone, and sign-out also removes the keys earlier builds left in localStorage.
- [x] An `initialized` flag that is never persisted. It is false on the server and on the first client render, so the guard renders one neutral loader until initialize() finishes and hydration always matches.
- [x] A refused refresh (the shared refresher's `rejected` outcome) or a refused `/me` (401, or a 403 that is not a subscription refusal) clears the session. With no session the guard sends the person to SSO sign-in once per page load; a second request is ignored so it can never overwrite the PKCE verifier the first is waiting on.
- [x] An outage never signs anyone out: a refresh that could not reach auth-api keeps the session, and initialize() keeps a saved profile when `/me` cannot be reached.
- [x] Every auth-api call has a 15 second timeout, so no step can leave the loader up for good.
- [x] `useMe` renews an expired token once before it reports a 401, and never refetches a failed read just because a component mounts.
- [x] The guard waits for `/me` only when no profile is known at all; a saved profile shows the app at once.
- [x] The API client's 401 handler now covers ticketing-api's own `auth/me`, and signs out only when the refresh was refused.
- [x] Tenant headers come from the signed-in profile held in the API client (treasury-ui's `setTenantContext` and `setPlatformOwner`), so a platform owner really sends none.
- [x] The callback page uses the shared `SSOCallbackError` card and offers to sign in again when it is opened without a code.
- [x] Users page at `/admin/settings/team`: everyone with their roles, add a person by email, give a role with an optional end date, take a role away.
- [x] Roles page at `/admin/settings/roles`: default and custom roles, create, copy, customise a default role into the tenant's own copy, rename, delete, the permission matrix by module and the change log.
- [x] Both pages in the admin nav, gated by `ticketing.rbac.view` or `ticketing.rbac.manage`; without `rbac.manage` the pages are read only.
- [x] Every new string in English and Swahili.
- [ ] Type-check, lint and build.
- [ ] Check both pages against the deployed ticketing-api endpoints.
- [ ] Confirm in production that a refused session goes to sign-in once and that error 418 is gone.

## Acceptance criteria

- With a saved session whose refresh token auth-api refuses, a page load shows "Initializing session...", then "Redirecting to sign-in...", and lands on the SSO sign-in page with one refresh call and at most one `/me` call.
- A hard reload of any signed-in page logs no hydration error.
- A person with `rbac.view` only sees both pages with no add, save, copy, rename or delete controls.
- At 390 pixels wide both pages read without sideways scrolling; opening a role scrolls its permissions into view.
