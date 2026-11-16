# Sprint 3: Admin Console

**Status: Partial.** Teams, agents, categories, SLA policies, routing rules and the knowledge base are managed from the admin console, gated by ticketing permissions. The settings page is a placeholder and there is no role administration screen yet.

## Tasks

- [x] `/[orgSlug]/admin`: dashboard with status counts and the period's created and resolved tickets
- [x] `/admin/teams` and `/admin/agents` on the shared `DataTable`, with edit sheets
- [x] `/admin/categories`, `/admin/sla` and `/admin/routing` on the existing API routes, with a condition editor for routing rules
- [x] Every admin route gated by permission through `RouteGuard` and the shared nav definition, not by a hard-coded role check
- [x] Tenant branding from shared-ui-lib `/tenant`
- [ ] `/admin/settings`: today it shows "Settings coming soon" (channels and forwarding address in sprint 10)
- [ ] Role administration on `GET /ticketing/roles`, `GET /ticketing/users` and `PUT /ticketing/users/{userId}/roles`
- [ ] Adding an agent from the tenant's user directory (needs an API endpoint, see the plan's known issues)

## Acceptance criteria

- A supervisor sees SLA policies and routing rules read-only and cannot create them. Met through the permission gates.
