"use client";

import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateTicket } from "@/hooks/useTickets";
import { useCategories } from "@/hooks/useTickets";
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
import { orgRoute } from "@/lib/utils";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const schema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  priority: z.enum(["low", "normal", "high", "urgent", "critical"]).default("normal"),
  channel: z.enum(["web", "email", "api", "chat", "phone", "internal"]).default("web"),
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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: "normal", channel: "web" },
  });

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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={orgRoute(orgSlug, "/tickets")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tickets
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-black text-foreground">Create New Ticket</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Describe the issue and we&apos;ll get it assigned to the right team.
        </p>
      </div>

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
