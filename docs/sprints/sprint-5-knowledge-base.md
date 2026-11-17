# Sprint 5: Knowledge Base UI

**Status: Written 2026-11-17, not yet built or deployed.** The knowledge base browser, the article reader by slug, votes and staff article management with the shared editor are built. The public help center, the category list and deflection on the public support form were written with [sprint 12](sprint-12-ai-public-kb.md).

## Tasks

- [x] `/[orgSlug]/kb`: article list with debounced search
- [x] `/[orgSlug]/kb/[slug]`: reader with rich text rendering and helpful or not helpful votes (by article id)
- [x] `/admin/kb`, `/admin/kb/new`, `/admin/kb/[articleId]`: staff list on the shared `DataTable`, `ArticleForm` with the shared `RichTextEditor`
- [x] A public knowledge base outside the signed-in layout: `/support/kb?org=<slug>` and `/support/kb/<slug>?org=<slug>` (sprint 12, written)
- [x] Category list from the API (`GET /kb/categories`) as filter chips on the public and signed-in lists (written)
- [x] Deflection: matching articles on the signed-in and public ticket forms as the subject is typed (sprint 12, written)
- [x] Keyset paging with "Load more" on the staff and public lists (written)

## Acceptance criteria

- Staff publish an article and a signed-in customer reads it by slug. Met.
- A visitor without an account reads a public article. Written, to be checked once built and deployed.
