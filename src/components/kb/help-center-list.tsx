"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { SearchInput, useDebouncedSearch } from "@bengo-hub/shared-ui-lib/search";
import { usePublicArticleList, usePublicCategories } from "@/hooks/useKB";
import { flattenPages } from "@/hooks/useTickets";
import { useT } from "@/hooks/useT";
import { LoadMore } from "@/components/common/load-more";
import { cn } from "@/lib/utils";

/**
 * The public knowledge base list, shared by the public help center (/support/kb?org=) and the
 * signed-in reading page (/{org}/kb). Only published, public articles ever reach it: the API
 * filters them server side. Search is debounced and a newer term aborts the older request;
 * categories filter the list; pages after the first load on "Load more".
 */
export function HelpCenterList({
  tenantSlug,
  articleHref,
}: {
  tenantSlug: string;
  /** The link to one article for this page's own routes. */
  articleHref: (slug: string) => string;
}) {
  const { t } = useT();
  const [category, setCategory] = useState("");
  const search = useDebouncedSearch();
  const query = usePublicArticleList(tenantSlug, category, search.term);
  const categories = usePublicCategories(tenantSlug);
  const articles = useMemo(() => flattenPages(query.data), [query.data]);

  return (
    <div className="space-y-4">
      <SearchInput
        search={search}
        busy={query.isFetching && !query.isFetchingNextPage}
        placeholder={t("helpCenter.searchPlaceholder")}
      />

      {(categories.data?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("helpCenter.allCategories")}>
          <CategoryChip active={category === ""} onClick={() => setCategory("")}>
            {t("helpCenter.allCategories")}
          </CategoryChip>
          {categories.data!.map((c) => (
            <CategoryChip key={c.name} active={category === c.name} onClick={() => setCategory(c.name)}>
              {c.name} <span className="text-muted-foreground">{c.count}</span>
            </CategoryChip>
          ))}
        </div>
      )}

      {query.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : query.isError ? (
        <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {t("helpCenter.loadFailed")}
        </p>
      ) : articles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card py-12 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">
            {search.term || category ? t("helpCenter.emptySearch") : t("helpCenter.empty")}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {articles.map((article) => (
            <li key={article.id}>
              <Link
                href={articleHref(article.slug)}
                className="group flex items-center gap-3 p-4 transition-colors hover:bg-accent/60"
              >
                <div className="min-w-0 flex-1">
                  {article.category && (
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-primary">
                      {article.category}
                    </span>
                  )}
                  <p className="font-semibold wrap-break-word group-hover:text-primary">{article.title}</p>
                  {article.excerpt && (
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{article.excerpt}</p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <LoadMore
        shown={articles.length}
        hasMore={!!query.hasNextPage}
        loading={query.isFetchingNextPage}
        onLoadMore={() => void query.fetchNextPage()}
      />
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
        active ? "border-primary bg-primary/10 font-medium text-primary" : "border-border bg-card hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}
