# Ticketing Service Frontend - Implementation Plan

## Executive Summary

**System Purpose**: Multi-tenant customer support and helpdesk ticketing frontend for Codevertex ecosystem. Provides intuitive interfaces for customers, agents, supervisors, and administrators to create, manage, and resolve support tickets with real-time updates, knowledge base access, and comprehensive analytics.

**Key Capabilities**:
- Customer ticket creation and tracking portal
- Agent workspace with ticket queue and assignment
- Supervisor dashboard with team management and analytics
- Admin console for configuration and reporting
- Knowledge base search and browsing
- Real-time ticket updates via WebSocket/SSE
- Mobile-responsive design

**Technology Stack**: Next.js 15 (App Router), React 19+, TypeScript, Tailwind CSS, shadcn/ui, Zustand, TanStack Query

---

## Technology Stack

### Core Framework
- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript 5+
- **UI Library**: React 19+
- **Styling**: Tailwind CSS 3+
- **Component Library**: shadcn/ui (Radix UI primitives)
- **State Management**: Zustand for client state, TanStack Query for server state
- **Form Handling**: React Hook Form + Zod validation
- **Routing**: Next.js App Router with file-based routing

### Data & Networking
- **Data Fetching**: TanStack Query (React Query)
- **HTTP Client**: Axios with interceptors
- **Real-time**: WebSocket/SSE for live updates
- **Caching**: TanStack Query cache + React Query DevTools

### UI & Design
- **Design System**: shadcn/ui components
- **Icons**: Lucide React
- **Charts**: Recharts or Chart.js
- **Rich Text**: Tiptap or similar
- **Date Handling**: date-fns
- **Internationalization**: next-intl

### Development Tools
- **Testing**: Vitest + Testing Library
- **E2E Testing**: Playwright
- **Linting**: ESLint
- **Formatting**: Prettier
- **Type Checking**: TypeScript strict mode

### DevOps
- **Containerization**: Multi-stage Docker builds
- **Orchestration**: Kubernetes (via centralized devops-k8s)
- **CI/CD**: GitHub Actions → ArgoCD
- **Build**: Next.js standalone output

---

## Application Structure

### 1. Customer Portal

**Features**:
- Ticket creation form with category/priority selection
- Ticket list with status filters
- Ticket detail view with comments and attachments
- Knowledge base search and browsing
- Customer satisfaction surveys
- Profile and preferences

**Routes**:
- `/` - Dashboard (ticket list)
- `/tickets/new` - Create ticket
- `/tickets/[id]` - Ticket detail
- `/knowledge-base` - Knowledge base
- `/knowledge-base/[id]` - Article detail
- `/profile` - Profile settings

### 2. Agent Workspace

**Features**:
- Ticket queue with filters and sorting
- Ticket assignment and reassignment
- Ticket detail with comment thread
- Internal notes
- SLA tracking and alerts
- Agent performance metrics
- Availability management

**Routes**:
- `/agent` - Ticket queue
- `/agent/tickets/[id]` - Ticket detail
- `/agent/knowledge-base` - Knowledge base
- `/agent/performance` - Performance metrics
- `/agent/settings` - Agent settings

### 3. Supervisor Dashboard

**Features**:
- Team overview and ticket distribution
- Agent performance monitoring
- SLA compliance dashboard
- Escalation management
- Team analytics
- Assignment rules configuration

**Routes**:
- `/supervisor` - Dashboard
- `/supervisor/team` - Team management
- `/supervisor/analytics` - Analytics
- `/supervisor/sla` - SLA management
- `/supervisor/rules` - Assignment rules

### 4. Admin Console

**Features**:
- System configuration
- User and team management
- SLA policy management
- Knowledge base administration
- System analytics and reports
- Integration settings

**Routes**:
- `/admin` - Dashboard
- `/admin/users` - User management
- `/admin/teams` - Team management
- `/admin/sla` - SLA policies
- `/admin/knowledge-base` - KB administration
- `/admin/analytics` - Analytics
- `/admin/settings` - System settings

---

## State Management

### Client State (Zustand)

**Stores**:
- `authStore` - Authentication state
- `ticketStore` - Ticket list and filters
- `uiStore` - UI state (modals, sidebars, theme)
- `notificationStore` - Notification queue

### Server State (TanStack Query)

**Queries**:
- `useTickets` - Ticket list with filters
- `useTicket` - Single ticket details
- `useTicketComments` - Ticket comments
- `useAgents` - Agent list
- `useTeams` - Team list
- `useKBArticles` - Knowledge base articles
- `useSLA` - SLA records
- `useAnalytics` - Analytics data

**Mutations**:
- `useCreateTicket` - Create ticket
- `useUpdateTicket` - Update ticket
- `useAddComment` - Add comment
- `useAssignTicket` - Assign ticket
- `useUpdateStatus` - Update ticket status

---

## Real-time Updates

### WebSocket/SSE Integration

**Channels**:
- Ticket updates (status, assignment, comments)
- New ticket notifications
- SLA breach alerts
- Agent availability changes

**Implementation**:
- WebSocket connection per tenant
- Automatic reconnection
- Message queuing for offline scenarios

---

## Integration Points

### Backend API

**Base URL**: `TICKETING_API_BASE_URL`

**Key Endpoints**:
- `GET /api/v1/{tenant}/tickets` - List tickets
- `POST /api/v1/{tenant}/tickets` - Create ticket
- `GET /api/v1/{tenant}/tickets/{id}` - Get ticket
- `PUT /api/v1/{tenant}/tickets/{id}` - Update ticket
- `POST /api/v1/{tenant}/tickets/{id}/comments` - Add comment
- `POST /api/v1/{tenant}/tickets/{id}/assign` - Assign ticket
- `GET /api/v1/{tenant}/knowledge-base/articles` - List articles
- `GET /api/v1/{tenant}/analytics` - Get analytics

### Auth Service

**Integration**: JWT token validation, user identity

**Flow**:
1. User logs in via auth-service
2. Receive JWT token
3. Include token in API requests
4. Refresh token on expiry

### Notifications Service

**Integration**: Real-time notifications for ticket updates

**Flow**:
1. Subscribe to notification events
2. Display notifications in UI
3. Mark as read when viewed

---

## Sprint Delivery Plan

See `docs/sprints/` folder for detailed sprint plans:
- Sprint 0: Foundations
- Sprint 1: Customer Portal
- Sprint 2: Agent Workspace
- Sprint 3: Supervisor Dashboard
- Sprint 4: Admin Console
- Sprint 5: Real-time Updates
- Sprint 6: Analytics & Reporting
- Sprint 7: Mobile Optimization
- Sprint 8: Launch & Handover

---

## Runtime Ports & Environments

- **Local development**: Service runs on port **3000** (Next.js default)
- **Cloud deployment**: All frontend services listen on **port 3000** behind ingress controllers

---

## References

- [Backend Plan](../ticketing-api/plan.md)
- [Backend Integrations](../ticketing-api/docs/integrations.md)
- [Sprint Plans](docs/sprints/)

