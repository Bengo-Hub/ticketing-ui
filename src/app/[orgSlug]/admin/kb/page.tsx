"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdminArticles, useDeleteArticle } from "@/hooks/useKB";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Badge,
} from "@/components/ui/base";
import { formatRelativeTime, orgRoute } from "@/lib/utils";
import type { ArticleStatus } from "@/types/kb";
import {
  BookOpen,
  PlusCircle,
  Search,
  Edit,
  Trash2,
  Eye,
  ThumbsUp,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

const STATUS_OPTIONS: Array<{ label: string; value: ArticleStatus | "" }> = [
  { label: "All Statuses", value: "" },
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
  { label: "Archived", value: "archived" },
];

const STATUS_BADGE: Record<ArticleStatus, string> = {
  draft: "bg-yellow-100 text-yellow-700 border-yellow-200",
  published: "bg-green-100 text-green-700 border-green-200",
  archived: "bg-muted text-muted-foreground border-border",
};

export default function AdminKBPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ArticleStatus | "">("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useAdminArticles({
    tenantSlug: orgSlug,
    search: search || undefined,
    status: status || undefined,
    page,
    limit: 20,
  });

  const deleteArticle = useDeleteArticle(orgSlug);

  const articles = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deleteArticle.mutateAsync(id);
      toast.success("Article deleted");
    } catch {
      toast.error("Failed to delete article");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total > 0 ? `${total} articles` : "No articles yet"}
          </p>
        </div>
        <Button
          onClick={() => router.push(orgRoute(orgSlug, "/admin/kb/new"))}
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
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value as ArticleStatus | ""); setPage(1); }}
              className="h-10 rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {isError ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">Failed to load articles.</p>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No articles found.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first article to start building the knowledge base.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-border">
            {articles.map((article) => (
              <div key={article.id} className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[article.status]}`}
                    >
                      {article.status}
                    </span>
                    {article.category && (
                      <span className="text-xs text-muted-foreground">{article.category}</span>
                    )}
                    {!article.is_public && (
                      <span className="text-xs text-muted-foreground italic">Internal</span>
                    )}
                  </div>
                  <p className="font-semibold text-foreground truncate">{article.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {article.view_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" /> {article.helpful_count}
                    </span>
                    <span>{formatRelativeTime(article.updated_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(orgRoute(orgSlug, `/kb/${article.slug}`))}
                    title="Preview"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(orgRoute(orgSlug, `/admin/kb/${article.id}`))}
                    title="Edit"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleDelete(article.id, article.title)}
                    disabled={deleteArticle.isPending}
                    title="Delete"
                    className="text-destructive hover:text-destructive"
                  >
                    {deleteArticle.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
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
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
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
