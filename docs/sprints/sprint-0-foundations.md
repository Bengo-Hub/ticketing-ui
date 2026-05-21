# Sprint 0 - Foundations

**Duration**: Week 1  
**Status**: ⏳ Pending

---

## Overview

Sprint 0 establishes the foundational infrastructure, project structure, design system, and core authentication capabilities for the Ticketing frontend application.

---

## Objectives

1. Set up Next.js 15 project with App Router
2. Configure TypeScript, ESLint, and Prettier
3. Set up design system with shadcn/ui and Tailwind CSS
4. Implement authentication flow with auth-service
5. Set up state management (Zustand, TanStack Query)
6. Configure routing and navigation
7. Set up internationalization (i18n)
8. Create base layout components

---

## Technology Stack

### Core Framework

**Framework**: Next.js 15+ (App Router)  
**Language**: TypeScript 5+  
**UI Library**: React 19+

**Project Structure**:
```
ticketing-ui/
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── (auth)/           # Auth routes
│   │   ├── (customer)/       # Customer portal routes
│   │   ├── (agent)/          # Agent workspace routes
│   │   ├── (supervisor)/     # Supervisor dashboard routes
│   │   ├── (admin)/          # Admin console routes
│   │   └── layout.tsx        # Root layout
│   ├── components/           # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── tickets/          # Ticket components
│   │   ├── knowledge/        # Knowledge base components
│   │   └── shared/            # Shared components
│   ├── lib/                  # Utilities and helpers
│   │   ├── api/              # API client
│   │   ├── auth/             # Auth utilities
│   │   └── utils/            # General utilities
│   ├── stores/               # Zustand stores
│   ├── hooks/                # Custom React hooks
│   ├── types/                # TypeScript types
│   └── styles/               # Global styles
├── public/                   # Static assets
├── docs/                     # Documentation
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── tailwind.config.ts        # Tailwind config
├── next.config.mjs           # Next.js config
└── Dockerfile                # Container image
```

### UI & Styling

**Styling**: Tailwind CSS 3+  
**Component Library**: shadcn/ui (Radix UI)  
**Icons**: Lucide React  
**Theme**: Light/dark mode support

### State Management

**Client State**: Zustand  
**Server State**: TanStack Query (React Query)  
**Form State**: React Hook Form + Zod

### Development Tools

**Testing**: Vitest + Testing Library  
**E2E**: Playwright  
**Linting**: ESLint  
**Formatting**: Prettier

---

## Deliverables

### 1. Project Scaffolding

**Tasks**:
- Initialize Next.js 15 project with TypeScript
- Set up project structure
- Configure `package.json` with dependencies
- Set up `.gitignore`
- Create Dockerfile
- Set up `README.md`

**Dependencies**:
- `next@15+`
- `react@19+`
- `typescript@5+`
- `tailwindcss@3+`
- `@radix-ui/*` (via shadcn/ui)
- `zustand`
- `@tanstack/react-query`
- `react-hook-form`
- `zod`
- `axios`
- `date-fns`
- `next-intl`

**Acceptance Criteria**:
- Project structure follows Next.js App Router conventions
- Dockerfile builds successfully
- All dependencies are installed

### 2. TypeScript Configuration

**Tasks**:
- Configure `tsconfig.json` with strict mode
- Set up path aliases (`@/components`, `@/lib`, etc.)
- Configure type checking rules

**Acceptance Criteria**:
- TypeScript compiles without errors
- Path aliases work correctly
- Strict mode is enabled

### 3. Design System Setup

**Tasks**:
- Install and configure Tailwind CSS
- Set up shadcn/ui component library
- Configure theme colors and tokens
- Set up dark mode support
- Create base layout components

**Components to Install**:
- Button
- Card
- Input
- Select
- Dialog
- Dropdown Menu
- Table
- Badge
- Avatar
- Tabs
- Toast

**Acceptance Criteria**:
- Tailwind CSS is configured
- shadcn/ui components are installed
- Dark mode works
- Base layout components are created

### 4. Authentication Flow

**Tasks**:
- Set up auth store (Zustand)
- Create login page
- Implement JWT token management
- Set up protected route middleware
- Create auth API client

**Auth Flow**:
1. User logs in via auth-service
2. Receive JWT token
3. Store token in Zustand store
4. Include token in API requests
5. Refresh token on expiry

**Acceptance Criteria**:
- Login page works
- JWT tokens are stored and managed
- Protected routes require authentication
- Token refresh works

### 5. API Client Setup

**Tasks**:
- Set up Axios instance
- Configure base URL and interceptors
- Add request/response interceptors
- Set up error handling
- Configure retry logic

**Interceptors**:
- Request: Add JWT token, add request ID
- Response: Handle errors, refresh token on 401

**Acceptance Criteria**:
- API client is configured
- Interceptors work correctly
- Error handling is consistent

### 6. State Management

**Tasks**:
- Set up Zustand stores
- Configure TanStack Query
- Create custom hooks for data fetching
- Set up query cache configuration

**Stores**:
- `authStore` - Authentication state
- `uiStore` - UI state (modals, theme, etc.)

**Acceptance Criteria**:
- Zustand stores work correctly
- TanStack Query is configured
- Custom hooks are created

### 7. Routing & Navigation

**Tasks**:
- Set up route groups for different user roles
- Create navigation components
- Set up route protection
- Configure redirects

**Route Groups**:
- `(auth)` - Authentication pages
- `(customer)` - Customer portal
- `(agent)` - Agent workspace
- `(supervisor)` - Supervisor dashboard
- `(admin)` - Admin console

**Acceptance Criteria**:
- Routes are organized correctly
- Navigation works
- Route protection works

### 8. Internationalization

**Tasks**:
- Set up next-intl
- Create translation files (EN, SW)
- Set up language switcher
- Configure locale routing

**Languages**:
- English (en)
- Swahili (sw)

**Acceptance Criteria**:
- i18n is configured
- Translations work
- Language switcher works

### 9. Testing Setup

**Tasks**:
- Configure Vitest
- Set up Testing Library
- Create test utilities
- Set up Playwright for E2E

**Acceptance Criteria**:
- Tests can be run
- Test utilities are available
- E2E setup is complete

### 10. CI/CD Pipeline

**Tasks**:
- Set up GitHub Actions workflow
- Configure build and test steps
- Set up Docker image building
- Configure ArgoCD deployment manifests

**Pipeline Steps**:
- Lint code
- Type check
- Run tests
- Build Next.js app
- Build Docker image
- Push to registry

**Acceptance Criteria**:
- CI pipeline runs on PR and merge
- Docker images are built and pushed
- Deployment manifests are ready

---

## Testing Strategy

### Unit Tests
- Test components in isolation
- Test custom hooks
- Test utility functions

### Integration Tests
- Test API integration
- Test authentication flow
- Test state management

### E2E Tests
- Test critical user flows
- Test authentication
- Test ticket creation

**Acceptance Criteria**:
- All tests pass
- Test coverage >70%
- E2E tests run in CI

---

## Definition of Done

- [ ] Next.js project is set up
- [ ] TypeScript is configured
- [ ] Design system is set up
- [ ] Authentication flow works
- [ ] API client is configured
- [ ] State management is set up
- [ ] Routing and navigation work
- [ ] Internationalization is configured
- [ ] Testing is set up
- [ ] CI/CD pipeline is configured
- [ ] Documentation is complete
- [ ] Code review is complete

---

## Next Sprint

**Sprint 1**: Customer Portal
- Ticket creation form
- Ticket list view
- Ticket detail view
- Knowledge base search

