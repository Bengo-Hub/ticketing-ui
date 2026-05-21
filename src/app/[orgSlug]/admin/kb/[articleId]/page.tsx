"use client";

import { useParams, useRouter } from "next/navigation";
import { useArticle, useUpdateArticle } from "@/hooks/useKB";
import { ArticleForm, articleDataToFormValues, formValuesToPayload } from "@/components/kb/ArticleForm";
import type { ArticleFormData } from "@/components/kb/ArticleForm";
import { orgRoute } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function EditKBArticlePage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;
  const articleId = params.articleId as string;

  const { data: article, isLoading, isError } = useArticle(orgSlug, articleId);
  const updateArticle = useUpdateArticle(orgSlug, articleId);

  const handleSubmit = async (data: ArticleFormData) => {
    try {
      await updateArticle.mutateAsync(formValuesToPayload(data));
      toast.success("Article updated");
      router.push(orgRoute(orgSlug, "/admin/kb"));
    } catch {
      toast.error("Failed to update article");
    }
  };

  if (isError) {
    return (
      <div className="max-w-3xl mx-auto">
        <p className="text-sm text-destructive font-medium">Failed to load article.</p>
      </div>
    );
  }

  if (isLoading || !article) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href={orgRoute(orgSlug, "/admin/kb")}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Knowledge Base
      </Link>

      <div>
        <h1 className="text-2xl font-black text-foreground">Edit Article</h1>
        <p className="text-sm text-muted-foreground mt-0.5 truncate">{article.title}</p>
      </div>

      <ArticleForm
        defaultValues={articleDataToFormValues(article)}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
        isLoading={updateArticle.isPending}
      />
    </div>
  );
}
