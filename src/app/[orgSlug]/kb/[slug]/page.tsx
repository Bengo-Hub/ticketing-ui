"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useArticle, useVoteArticle } from "@/hooks/useKB";
import { Button, Card, CardContent, Separator } from "@/components/ui/base";
import { formatDateTime, orgRoute } from "@/lib/utils";
import { ArrowLeft, BookOpen, Eye, ThumbsDown, ThumbsUp, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function KBArticlePage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const slug = params.slug as string;

  const { data: article, isLoading, isError } = useArticle(orgSlug, slug);
  const vote = useVoteArticle(orgSlug);

  const handleVote = async (helpful: boolean) => {
    if (!article) return;
    try {
      await vote.mutateAsync({ id: article.id, slug, helpful });
      toast.success(helpful ? "Marked as helpful" : "Feedback recorded");
    } catch {
      toast.error("Failed to record feedback");
    }
  };

  if (isError) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
        <AlertCircle className="h-5 w-5" />
        <p className="text-sm font-medium">Article not found or failed to load.</p>
      </div>
    );
  }

  if (isLoading || !article) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href={orgRoute(orgSlug, "/kb")}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Knowledge Base
      </Link>

      <div>
        {article.category && (
          <span className="text-xs uppercase tracking-widest font-bold text-primary mb-2 block">
            {article.category}
          </span>
        )}
        <h1 className="text-2xl font-black text-foreground">{article.title}</h1>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            <span>{article.view_count} views</span>
          </div>
          {article.published_at && (
            <span>Published {formatDateTime(article.published_at)}</span>
          )}
          <span>Updated {formatDateTime(article.updated_at)}</span>
        </div>
        {article.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <Separator />

      <Card>
        <CardContent className="pt-6">
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm text-foreground leading-relaxed">
            {article.content}
          </div>
        </CardContent>
      </Card>

      {/* Helpfulness voting */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Was this article helpful?</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ThumbsUp className="h-3.5 w-3.5 text-green-500" />
                <span>{article.helpful_count}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ThumbsDown className="h-3.5 w-3.5 text-red-500" />
                <span>{article.not_helpful_count}</span>
              </div>
              <Separator orientation="vertical" className="h-6" />
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => void handleVote(true)}
                disabled={vote.isPending}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                Yes
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => void handleVote(false)}
                disabled={vote.isPending}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
                No
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
