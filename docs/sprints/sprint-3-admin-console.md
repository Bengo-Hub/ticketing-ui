# Sprint 3 — Admin Console

**Duration**: Week 4  
**Status**: ✅ Complete

---

## Overview

Admin-only section for managing teams, agents, and global settings. Protected by role check — only `admin` role can access.

---

## Deliverables

### Routes
- `GET /[orgSlug]/admin` — admin dashboard overview
- `GET /[orgSlug]/admin/teams` — team list + CRUD modals
- `GET /[orgSlug]/admin/agents` — agent list + CRUD modals
- `GET /[orgSlug]/admin/settings` — settings placeholder

### Components
- `Sidebar` — role-aware navigation (hides admin links for non-admin)
- `Header` — tenant branding, user menu, logout
- Team list with add/edit/delete modals
- Agent list with invite/edit/deactivate modals

### API Integration
- `src/lib/api/agents.ts` — team and agent CRUD endpoints
- `src/lib/api/tenant.ts` — branding endpoint
- `src/providers/branding-provider.tsx` — fetches `GET /{tenant}/branding`, injects CSS variables for brand colours
- `src/providers/theme-provider.tsx` — shadcn/ui theme wrapper

### Role-Based Guard
```tsx
// Redirect non-admin users to /tickets
if (session.role !== 'admin' && session.role !== 'supervisor') {
    redirect(`/${orgSlug}/unauthorized`)
}
```

---

## Definition of Done

- [x] Team CRUD in admin console
- [x] Agent CRUD in admin console
- [x] Role-based access guard (admin/supervisor only)
- [x] Branding provider loads tenant colours
- [x] pnpm build passes clean

---

## Next Sprint

**Sprint 4**: SLA Visualization — SLA countdown timers, breach badges, escalation indicators on tickets.
