"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { createPublicTicket } from "@/lib/api/tickets";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
} from "@/components/ui/base";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const schema = z.object({
  customer_name: z.string().min(2, "Name is required"),
  customer_email: z.string().email("Valid email is required"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  description: z.string().min(10, "Please describe your issue in more detail"),
  priority: z.enum(["low", "normal", "high"]),
  tenant_slug: z.string().min(1, "Organization is required"),
});

type FormData = z.infer<typeof schema>;

export default function SupportPage() {
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: "normal" },
  });

  const mutation = useMutation({
    mutationFn: createPublicTicket,
    onSuccess: (ticket) => {
      setTicketNumber(ticket.ticket_number);
      setSubmitted(true);
    },
    onError: () => {
      toast.error("Failed to submit ticket. Please try again.");
    },
  });

  if (submitted) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
          <div>
            <h2 className="text-xl font-semibold">Ticket submitted!</h2>
            {ticketNumber && (
              <p className="mt-1 text-sm text-muted-foreground">
                Ticket number: <span className="font-mono font-medium">{ticketNumber}</span>
              </p>
            )}
            <p className="mt-3 text-sm text-muted-foreground">
              We sent a confirmation to your email with a link to track this ticket.
            </p>
          </div>
          <Button variant="outline" onClick={() => setSubmitted(false)}>
            Submit another request
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit a support request</CardTitle>
        <CardDescription>
          Fill in the form below and our team will get back to you as soon as possible.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="customer_name">Your name</Label>
              <Input id="customer_name" {...register("customer_name")} placeholder="Jane Doe" />
              {errors.customer_name && (
                <p className="text-xs text-destructive">{errors.customer_name.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="customer_email">Email address</Label>
              <Input
                id="customer_email"
                type="email"
                {...register("customer_email")}
                placeholder="jane@example.com"
              />
              {errors.customer_email && (
                <p className="text-xs text-destructive">{errors.customer_email.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="tenant_slug">Organization</Label>
            <Input
              id="tenant_slug"
              {...register("tenant_slug")}
              placeholder="your-company-slug"
            />
            {errors.tenant_slug && (
              <p className="text-xs text-destructive">{errors.tenant_slug.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              {...register("subject")}
              placeholder="Brief description of your issue"
            />
            {errors.subject && (
              <p className="text-xs text-destructive">{errors.subject.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Describe your issue in detail..."
              rows={5}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="priority">Priority</Label>
            <select
              id="priority"
              {...register("priority")}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
          </div>

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit request
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
