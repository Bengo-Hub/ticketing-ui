"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BookOpen, ExternalLink, Lightbulb, Loader2, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { SearchableCombobox } from "@bengo-hub/shared-ui-lib/combobox";
import { RichTextEditor } from "@bengo-hub/shared-ui-lib/rich-text-editor";
import { useDebouncedValue } from "@bengo-hub/shared-ui-lib/search";
import { useSearchQuery } from "@bengo-hub/shared-ui-lib/search/query";
import { useCreateTicket } from "@/hooks/useTickets";
import { useCategories } from "@/hooks/useCategories";
import { useServicePermissions } from "@/hooks/useServicePermissions";
import { searchPublicArticles } from "@/lib/api/kb";
import { classifyDraft } from "@/lib/api/ai";
import { useAiAction } from "@/hooks/useAI";
import { useT } from "@/hooks/useT";
import { PERM } from "@/lib/rbac/permissions";
import { AiButton, AiCreditHint, AiError } from "@/components/ai/AiStatus";
import { useTicketLabels } from "@/lib/ticket-options";
import { PageHeader } from "@/components/common/page-header";
import { Field } from "@/components/common/field";
import { toPlainText } from "@/components/common/rich-text";
import { Button, Card, CardContent, Input } from "@/components/ui/base";
import { orgRoute } from "@/lib/utils";

const schema = z.object({
  subject: z.string().trim().min(5, "Subject must be at least 5 characters"),
  description: z.string().refine((v) => toPlainText(v).length >= 10, "Description must be at least 10 characters"),
  priority: z.enum(["low", "normal", "high", "urgent", "critical"]),
  channel: z.enum(["web", "email", "api", "chat", "whatsapp", "phone", "internal"]),
  category_id: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewTicketPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;
  const { isStaff, isPlatformOwner, can } = useServicePermissions(orgSlug);
  const { t } = useT();
  // AI classify needs tickets.view and tickets.add (docs/ai.md), so customers never see it.
  const canClassify = can(PERM.ticketsView) && can(PERM.ticketsAdd);
  const { data: categories = [] } = useCategories(orgSlug);
  const createTicket = useCreateTicket(orgSlug);
  const labels = useTicketLabels();
  const [deflectionDismissed, setDeflectionDismissed] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { subject: "", description: "", priority: "normal", channel: "web", category_id: "" },
  });

  // "Suggest category and priority": the click is the agent accepting, so the suggestion is
  // preselected and stays editable. A draft that tried to instruct the AI preselects nothing.
  const classify = useAiAction(
    (key) =>
      classifyDraft(
        orgSlug,
        { subject: getValues("subject").trim(), description: getValues("description"), channel: getValues("channel") },
        key,
      ),
    (c) => {
      if (c.injected) return;
      const priority = schema.shape.priority.safeParse(c.priority);
      if (priority.success) setValue("priority", priority.data, { shouldDirty: true });
      if (c.category && categories.some((cat) => cat.id === c.category?.id && cat.is_active)) {
        setValue("category_id", c.category.id, { shouldDirty: true });
      }
    },
  );
  const classification = classify.data;
  const hasDraftText = (watch("subject") ?? "").trim() !== "" || toPlainText(watch("description")) !== "";

  // Knowledge base deflection: the subject is searched once typing pauses, older requests are aborted.
  const subjectTerm = useDebouncedValue((watch("subject") ?? "").trim());
  const suggestions = useSearchQuery({
    queryKey: ["kb", "deflection", orgSlug],
    term: subjectTerm.length >= 5 ? subjectTerm : "",
    allowEmpty: false,
    enabled: !deflectionDismissed,
    fetcher: (term, signal) => searchPublicArticles(orgSlug, term, 3, signal),
  });
  const kbSuggestions = subjectTerm.length >= 5 ? (suggestions.data ?? []) : [];
  const showDeflection = !deflectionDismissed && (suggestions.isFetching || kbSuggestions.length > 0);

  const categoryOptions = categories.filter((c) => c.is_active).map((c) => ({ value: c.id, label: c.name }));

  const onSubmit = async (data: FormData) => {
    try {
      const ticket = await createTicket.mutateAsync({
        subject: data.subject.trim(),
        description: data.description,
        priority: data.priority,
        channel: data.channel,
        category_id: data.category_id || undefined,
      });
      toast.success("Ticket created");
      router.push(orgRoute(orgSlug, `/tickets/${ticket.id}`));
    } catch {
      toast.error("The ticket could not be created. Please try again.");
    }
  };

  const submitting = isSubmitting || createTicket.isPending;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader
        back={{ href: orgRoute(orgSlug, "/tickets"), label: "Tickets" }}
        icon={PlusCircle}
        title="New ticket"
        subtitle="Describe the issue and it will be routed to the right team."
      />

      {showDeflection && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Lightbulb className="h-4 w-4 text-primary" /> Articles that might help
              </p>
              <button
                type="button"
                onClick={() => setDeflectionDismissed(true)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Dismiss
              </button>
            </div>
            {suggestions.isFetching && kbSuggestions.length === 0 ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-8 animate-pulse rounded-lg bg-muted/50" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {kbSuggestions.map((article) => (
                  <Link
                    key={article.id}
                    href={orgRoute(orgSlug, `/kb/${article.slug}`)}
                    target="_blank"
                    className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2 transition-colors hover:border-primary/50"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <BookOpen className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="truncate text-sm font-medium">{article.title}</span>
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary" />
                  </Link>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">If none of these help, submit the ticket below.</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Field label="Subject" htmlFor="subject" required error={errors.subject?.message}>
              <Input id="subject" placeholder="A short summary of the issue" {...register("subject")} />
            </Field>

            <Field label="Description" required error={errors.description?.message}>
              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="What happened, what you expected, and any steps to reproduce it"
                    ariaLabel="Description"
                  />
                )}
              />
            </Field>

            {canClassify && (
              <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <AiButton pending={classify.isPending} onClick={classify.start} disabled={!hasDraftText}>
                    {t("ai.classify.action")}
                  </AiButton>
                  <AiCreditHint credits={classify.isPending ? undefined : classification?.credits} exempt={isPlatformOwner} />
                </div>
                {!hasDraftText && <p className="text-xs text-muted-foreground">{t("ai.classify.needText")}</p>}
                <AiError failure={classify.failure} onRetry={classify.retry} />
                {classification && !classify.failure && (
                  <div className="space-y-1 text-xs">
                    {classification.injected ? (
                      <p className="font-medium text-destructive">{t("ai.classify.injected")}</p>
                    ) : (
                      <>
                        <p className="font-medium">
                          {t("ai.classify.applied", {
                            category: classification.category?.name ?? t("ai.classify.noCategory"),
                            priority: labels.priority(classification.priority),
                          })}
                        </p>
                        {classification.reasoning && <p className="text-muted-foreground">{classification.reasoning}</p>}
                      </>
                    )}
                    {(classification.requires_human_review || classification.injected) && (
                      <p className="text-warning">{t("ai.classify.review")}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Priority">
                <Controller
                  control={control}
                  name="priority"
                  render={({ field }) => (
                    <SearchableCombobox
                      options={labels.priorityOptions}
                      value={field.value}
                      onChange={(v) => v && field.onChange(v)}
                      clearable={false}
                      searchPlaceholder="Priority"
                    />
                  )}
                />
              </Field>
              <Field label="Category">
                <Controller
                  control={control}
                  name="category_id"
                  render={({ field }) => (
                    <SearchableCombobox
                      options={categoryOptions}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="No category"
                      searchPlaceholder="Category"
                      emptyText="No categories"
                    />
                  )}
                />
              </Field>
              {isStaff && (
                <Field label="Channel" hint="How the customer reached you.">
                  <Controller
                    control={control}
                    name="channel"
                    render={({ field }) => (
                      <SearchableCombobox
                        options={labels.channelOptions}
                        value={field.value}
                        onChange={(v) => v && field.onChange(v)}
                        clearable={false}
                        searchPlaceholder="Channel"
                      />
                    )}
                  />
                </Field>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => router.push(orgRoute(orgSlug, "/tickets"))}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Create ticket
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
