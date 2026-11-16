# Sprint 5: Knowledge Base UI

**Status: Partial.** The knowledge base browser, the article reader by slug, votes and staff article management with the shared editor are built. A public knowledge base outside the signed-in layout and deflection on the ticket form are missing.

## Tasks

- [x] `/[orgSlug]/kb`: article list with debounced search
- [x] `/[orgSlug]/kb/[slug]`: reader with rich text rendering and helpful or not helpful votes (by article id)
- [x] `/admin/kb`, `/admin/kb/new`, `/admin/kb/[articleId]`: staff list on the shared `DataTable`, `ArticleForm` with the shared `RichTextEditor`
- [ ] A public knowledge base outside the signed-in layout; `/[orgSlug]/kb` sits inside `AuthProvider` today (sprint 12)
- [ ] Category list from the API; categories are free text today
- [ ] Deflection: matching articles on the ticket form as the subject is typed (sprint 12)

## Acceptance criteria

- Staff publish an article and a signed-in customer reads it by slug. Met.
- A visitor without an account reads a public article. Not met, sprint 12.
