"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { BookOpen, Eye, PlusCircle, ThumbsUp } from "lucide-react";
import { SearchableCombobox } from "@bengo-hub/shared-ui-lib/combobox";
import { TableFooter } from "@bengo-hub/shared-ui-lib/data-table";
import { SearchInput, useDebouncedSearch } from "@bengo-hub/shared-ui-lib/search";
import { useArticleSearch } from "@/hooks/useKB";
import { useServicePermissions } from "@/hooks/useServicePermissions";
import { PERM } from "@/lib/rbac/permissions";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/base";
import { formatRelativeTime, orgRoute } from "@/lib/utils";

const LIMIT = 20;

export default function KBPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;
  const { can } = useServicePermissions(orgSlug);

  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const search = useDebouncedSearch({ onTermChange: () => setPage(1) });
  const query = useArticleSearch({ tenantSlug: orgSlug, category: category || undefined, page, limit: LIMIT }, search.term);

  const articles = useMemo(() => query.data?.data ?? [], [query.data]);
  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  // The API has no category list for articles, so the picker offers the categories on this page
  // (and keeps the chosen one while it filters).
  const categoryOptions = useMemo(() => {
    const names = new Set(articles.map((a) => a.category).filter((c): c is string => !!c));
    if (category) names.add(category);
    return [...names].sort().map((c) => ({ value: c, label: c }));
  }, [articles, category]);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader
        icon={BookOpen}
        title="Knowledge base"
        subtitle={total > 0 ? `${total} articles` : undefined}
        actions={
          can(PERM.kbManage) ? (
            <Button onClick={() => router.push(orgRoute(orgSlug, "/admin/kb/new"))}>
              <PlusCircle className="h-4 w-4" /> New article
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <SearchInput search={search} busy={query.isFetching} placeholder="Search the knowledge base" />
        <SearchableCombobox
          options={categoryOptions}
          value={category}
          onChange={(v) => {
            setCategory(v);
            setPage(1);
          }}
          placeholder="All categories"
          emptyText="No categories yet"
        />
      </div>

      {query.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : query.isError ? (
        <p className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          The articles could not be loaded.
        </p>
      ) : articles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">
            {search.term || category ? "No articles match this search." : "No articles yet."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <ul className="divide-y divide-border">
            {articles.map((article) => (
              <li key={article.id}>
                <Link
                  href={orgRoute(orgSlug, `/kb/${article.slug}`)}
                  className="group flex items-start gap-4 p-4 transition-colors hover:bg-accent/60"
                >
                  <div className="min-w-0 flex-1">
                    {article.category && (
                      <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-primary">
                        {article.category}
                      </span>
                    )}
                    <p className="truncate font-semibold group-hover:text-primary">{article.title}</p>
                    {article.excerpt && (
                      <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{article.excerpt}</p>
                    )}
                  </div>
                  <div className="shrink-0 space-y-1 text-right text-xs text-muted-foreground">
                    <p className="flex items-center justify-end gap-1.5">
                      <Eye className="h-3 w-3" /> {article.view_count}
                    </p>
                    <p className="flex items-center justify-end gap-1.5">
                      <ThumbsUp className="h-3 w-3" /> {article.helpful_count}
                    </p>
                    <p>{formatRelativeTime(article.updated_at)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <TableFooter
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            total={total}
            pageSize={LIMIT}
            shownCount={articles.length}
          />
        </div>
      )}
    </div>
  );
}
