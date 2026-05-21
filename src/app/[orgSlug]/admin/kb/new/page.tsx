"use client";

import { useParams, useRouter } from "next/navigation";
import { useCreateArticle } from "@/hooks/useKB";
import { ArticleForm, formValuesToPayload } from "@/components/kb/ArticleForm";
import type { ArticleFormData } from "@/components/kb/ArticleForm";
import { orgRoute } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function NewKBArticlePage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;

  const createArticle = useCreateArticle(orgSlug);

  const handleSubmit = async (data: ArticleFormData) => {
    try {
      const article = await createArticle.mutateAsync(formValuesToPayload(data));
      toast.success("Article created");
      router.push(orgRoute(orgSlug, `/admin/kb/${article.id}`));
    } catch {
      toast.error("Failed to create article");
    }
  };

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
        <h1 className="text-2xl font-black text-foreground">New Article</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Create a new knowledge base article.
        </p>
      </div>

      <ArticleForm
        onSubmit={handleSubmit}
        submitLabel="Create Article"
        isLoading={createArticle.isPending}
      />
    </div>
  );
}
