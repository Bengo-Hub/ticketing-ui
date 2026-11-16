"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateTicket, useCategories } from "@/hooks/useTickets";
import { searchPublicArticles } from "@/lib/api/kb";
import type { KBArticle } from "@/types/kb";
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Separator,
  Textarea,
} from "@/components/ui/base";
import { orgRoute } from "@/lib/utils";
import { ArrowLeft, BookOpen, ExternalLink, Loader2, Lightbulb } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const schema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  priority: z.enum(["low", "normal", "high", "urgent", "critical"]),
  channel: z.enum(["web", "email", "api", "chat", "phone", "internal"]),
  category_id: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewTicketPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;

  const { data: categoriesData } = useCategories(orgSlug);
  const categories = categoriesData ?? [];
  const createTicket = useCreateTicket(orgSlug);

  // KB deflection state
  const [kbSuggestions, setKbSuggestions] = useState<KBArticle[]>([]);
  const [kbLoading, setKbLoading] = useState(false);
  const [deflectionDismissed, setDeflectionDismissed] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: "normal", channel: "web" },
  });

  const subject = watch("subject");

  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (query.length < 5) {
        setKbSuggestions([]);
        return;
      }
      setKbLoading(true);
      try {
        const results = await searchPublicArticles(orgSlug, query, 3);
        setKbSuggestions(results);
      } catch {
        // silently ignore — KB deflection is non-critical
      } finally {
        setKbLoading(false);
      }
    },
    [orgSlug],
  );

  useEffect(() => {
    if (deflectionDismissed) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void fetchSuggestions(subject ?? ""), 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [subject, fetchSuggestions, deflectionDismissed]);

  const onSubmit = async (data: FormData) => {
    try {
      const ticket = await createTicket.mutateAsync({
        subject: data.subject,
        description: data.description,
        priority: data.priority,
        channel: data.channel,
        category_id: data.category_id || undefined,
      });
      toast.success("Ticket created successfully");
      router.push(orgRoute(orgSlug, `/tickets/${ticket.id}`));
    } catch {
      toast.error("Failed to create ticket. Please try again.");
    }
  };

  const showDeflection =
    !deflectionDismissed && (kbLoading || kbSuggestions.length > 0);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href={orgRoute(orgSlug, "/tickets")}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Tickets
      </Link>

      <div>
        <h1 className="text-2xl font-black text-foreground">Create New Ticket</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Describe the issue and we&apos;ll get it assigned to the right team.
        </p>
      </div>

      {/* KB Deflection Panel */}
      {showDeflection && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">
                  Related articles that might help
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeflectionDismissed(true)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Dismiss
              </button>
            </div>
            {kbLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-8 rounded-lg bg-muted/50 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {kbSuggestions.map((article) => (
                  <Link
                    key={article.id}
                    href={orgRoute(orgSlug, `/kb/${article.slug}`)}
                    target="_blank"
                    className="flex items-center justify-between gap-3 rounded-lg bg-background border border-border px-3 py-2 hover:border-primary/50 hover:bg-primary/5 transition-colors group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                      <p className="text-sm font-medium text-foreground truncate">
                        {article.title}
                      </p>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                  </Link>
                ))}
              </div>
            )}
            <Separator />
            <p className="text-xs text-muted-foreground">
              If none of these help, submit your ticket below.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                placeholder="Brief description of the issue"
                {...register("subject")}
              />
              {errors.subject && (
                <p className="text-xs text-destructive">{errors.subject.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Provide detailed information about the issue..."
                rows={6}
                {...register("description")}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  {...register("priority")}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="channel">Channel</Label>
                <select
                  id="channel"
                  {...register("channel")}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="web">Web</option>
                  <option value="email">Email</option>
                  <option value="chat">Chat</option>
                  <option value="phone">Phone</option>
                  <option value="internal">Internal</option>
                </select>
              </div>
            </div>

            {categories.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="category_id">Category</Label>
                <select
                  id="category_id"
                  {...register("category_id")}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">No category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(orgRoute(orgSlug, "/tickets"))}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || createTicket.isPending}>
                {(isSubmitting || createTicket.isPending) && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Create Ticket
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
