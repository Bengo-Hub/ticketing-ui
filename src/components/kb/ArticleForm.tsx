"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { SearchableCombobox, type ComboboxOption } from "@bengo-hub/shared-ui-lib/combobox";
import { RichTextEditor } from "@bengo-hub/shared-ui-lib/rich-text-editor";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea } from "@/components/ui/base";
import { Field } from "@/components/common/field";
import { toPlainText } from "@/components/common/rich-text";
import type { ArticleStatus, CreateArticleData, KBArticle } from "@/types/kb";

const articleSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters"),
  content: z.string().refine((v) => toPlainText(v).length >= 10, "Content must be at least 10 characters"),
  excerpt: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]),
  is_public: z.boolean(),
});

export type ArticleFormData = z.infer<typeof articleSchema>;

export const ARTICLE_STATUS_OPTIONS: ComboboxOption[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const VISIBILITY_OPTIONS: ComboboxOption[] = [
  { value: "public", label: "Public", description: "Customers can read it in the help centre." },
  { value: "internal", label: "Internal only", description: "Only staff can read it." },
];

interface ArticleFormProps {
  defaultValues?: Partial<ArticleFormData>;
  onSubmit: (data: ArticleFormData) => Promise<void>;
  submitLabel: string;
  isLoading?: boolean;
}

export function ArticleForm({ defaultValues, onSubmit, submitLabel, isLoading }: ArticleFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
    defaultValues: { title: "", content: "", status: "draft", is_public: true, ...defaultValues },
  });

  const submitting = isSubmitting || isLoading;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Card>
        <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-3">
          <CardTitle className="text-base font-semibold">Article details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
          <Field label="Title" htmlFor="title" required error={errors.title?.message}>
            <Input id="title" placeholder="How to reset your password" {...register("title")} />
          </Field>
          <Field label="Excerpt" htmlFor="excerpt" hint="One or two sentences shown in article lists and search results.">
            <Textarea id="excerpt" rows={2} {...register("excerpt")} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Category" htmlFor="category">
              <Input id="category" placeholder="Billing" {...register("category")} />
            </Field>
            <Field label="Tags" htmlFor="tags" hint="Separate tags with commas.">
              <Input id="tags" placeholder="password, login" {...register("tags")} />
            </Field>
            <Field label="Status" required>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <SearchableCombobox
                    options={ARTICLE_STATUS_OPTIONS}
                    value={field.value}
                    onChange={(v) => v && field.onChange(v as ArticleStatus)}
                    clearable={false}
                  />
                )}
              />
            </Field>
            <Field label="Visibility">
              <Controller
                control={control}
                name="is_public"
                render={({ field }) => (
                  <SearchableCombobox
                    options={VISIBILITY_OPTIONS}
                    value={field.value ? "public" : "internal"}
                    onChange={(v) => v && field.onChange(v === "public")}
                    clearable={false}
                  />
                )}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-3">
          <CardTitle className="text-base font-semibold">Content</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <Controller
            control={control}
            name="content"
            render={({ field }) => (
              <RichTextEditor
                value={field.value}
                onChange={field.onChange}
                placeholder="Write the article"
                ariaLabel="Article content"
                className="[&_.prose-editor]:min-h-[320px]"
              />
            )}
          />
          {errors.content && (
            <p className="mt-1 text-xs text-destructive" role="alert">
              {errors.content.message}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting} className="w-full sm:w-auto sm:min-w-[140px]">
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
    status: article.status,
    is_public: article.is_public,
  };
}

export function formValuesToPayload(data: ArticleFormData): CreateArticleData {
  return {
    title: data.title.trim(),
    content: data.content,
    excerpt: data.excerpt?.trim() || undefined,
    category: data.category?.trim() || undefined,
    tags: data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
    status: data.status,
    is_public: data.is_public,
  };
}
