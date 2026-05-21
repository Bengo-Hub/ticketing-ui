"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
} from "@/components/ui/base";
import type { ArticleStatus, KBArticle } from "@/types/kb";
import { Loader2 } from "lucide-react";

const articleSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  excerpt: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]),
  is_public: z.boolean(),
});

export type ArticleFormData = z.infer<typeof articleSchema>;

interface ArticleFormProps {
  defaultValues?: Partial<ArticleFormData>;
  onSubmit: (data: ArticleFormData) => Promise<void>;
  submitLabel: string;
  isLoading?: boolean;
}

export function ArticleForm({ defaultValues, onSubmit, submitLabel, isLoading }: ArticleFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      status: "draft",
      is_public: true,
      ...defaultValues,
    },
  });

  const submitting = isSubmitting || isLoading;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Article Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" placeholder="Article title..." {...register("title")} />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              placeholder="Short summary shown in article lists..."
              rows={2}
              {...register("excerpt")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="e.g. billing, technical..."
                {...register("category")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="Comma-separated tags..."
                {...register("tags")}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <select
                id="status"
                {...register("status")}
                className="h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="is_public">Visibility</Label>
              <select
                id="is_public"
                {...register("is_public", { setValueAs: (v) => v === "true" })}
                className="h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="true">Public</option>
                <option value="false">Internal only</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Content *</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="content"
            placeholder="Write the article content here (Markdown supported)..."
            rows={20}
            className="font-mono text-sm"
            {...register("content")}
          />
          {errors.content && (
            <p className="mt-1 text-xs text-destructive">{errors.content.message}</p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting} className="min-w-[140px]">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

export function articleDataToFormValues(article: KBArticle): ArticleFormData {
  return {
    title: article.title,
    content: article.content,
    excerpt: article.excerpt ?? "",
    category: article.category ?? "",
    tags: (article.tags ?? []).join(", "),
    status: article.status as ArticleStatus,
    is_public: article.is_public,
  };
}

export function formValuesToPayload(data: ArticleFormData) {
  return {
    title: data.title,
    content: data.content,
    excerpt: data.excerpt || undefined,
    category: data.category || undefined,
    tags: data.tags
      ? data.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : undefined,
    status: data.status,
    is_public: data.is_public,
  };
}
