# Sprint 5 — Knowledge Base UI

**Duration**: Week 6  
**Status**: 🔲 Pending (depends on API Sprint 5)

---

## Overview

Customer-facing knowledge base browser and agent-side KB management. AI-powered article suggestions appear in the ticket creation flow to deflect tickets when self-service answers exist.

---

## Deliverables

### Customer Routes (public, no auth)
- `GET /[orgSlug]/kb` — KB home with categories and featured articles
- `GET /[orgSlug]/kb/search?q=...` — search results
- `GET /[orgSlug]/kb/articles/[slug]` — article reader

### Agent Routes (auth required)
- `GET /[orgSlug]/admin/kb` — article list with drafts
- `GET /[orgSlug]/admin/kb/new` — create article (markdown editor)
- `GET /[orgSlug]/admin/kb/[id]/edit` — edit article

### Components
- `ArticleCard` — title, summary, tag chips, view count
- `ArticleReader` — markdown renderer, helpful/not helpful vote
- `MarkdownEditor` — rich text editor with preview tab (use `@uiw/react-md-editor`)
- `KBSearchBar` — debounced search input

### AI Deflection on Ticket Create
When customer types a subject in the new ticket form:
1. Debounce 500ms → call `GET /{tenant}/kb/search?q={subject}`
2. Show top 3 articles in a panel: "These articles may answer your question"
3. Customer can dismiss and continue submitting ticket

---

## Definition of Done

- [ ] KB article browser (public)
- [ ] Article search with results
- [ ] Helpful/not-helpful vote
- [ ] Agent KB management (draft, publish, archive)
- [ ] AI deflection on ticket create form
- [ ] pnpm build passes clean

---

## Next Sprint

**Sprint 6**: Analytics Dashboard — charts, KPIs, CSAT scores.
