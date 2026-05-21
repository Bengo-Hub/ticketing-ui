"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useArticles } from "@/hooks/useKB";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@/components/ui/base";
import { formatRelativeTime, orgRoute } from "@/lib/utils";
import { BookOpen, Search, ThumbsUp, Eye, PlusCircle } from "lucide-react";

export default function KBPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useArticles({
    tenantSlug: orgSlug,
    search: search || undefined,
    category: category || undefined,
    status: "published",
    page,
    page_size: 20,
  });

  const articles = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  const categories = Array.from(new Set(articles.map((a) => a.category).filter(Boolean)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-primary" />
            Knowledge Base
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total > 0 ? `${total} articles` : "No articles yet"}
          </p>
        </div>
        <Button
          onClick={() => router.push(orgRoute(orgSlug, "/kb/new"))}
          className="gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          New Article
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            {categories.length > 0 && (
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                className="h-10 rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Articles */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No articles found.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first knowledge base article to help customers.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-border">
            {articles.map((article) => (
              <button
                key={article.id}
                type="button"
                onClick={() => router.push(orgRoute(orgSlug, `/kb/${article.id}`))}
                className="w-full text-left p-4 hover:bg-accent transition-colors group"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    {article.category && (
                      <span className="text-[10px] uppercase tracking-widest font-bold text-primary mb-1 block">
                        {article.category}
                      </span>
                    )}
                    <p className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {article.title}
                    </p>
                    {article.excerpt && (
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                        {article.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      {article.tags?.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground justify-end">
                      <Eye className="h-3 w-3" />
                      <span>{article.view_count}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground justify-end">
                      <ThumbsUp className="h-3 w-3" />
                      <span>{article.helpful_count}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(article.updated_at)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
