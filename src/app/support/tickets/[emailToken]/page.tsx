"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  getCustomerTickets,
  getCustomerTicket,
  addPublicComment,
  closePublicTicket,
} from "@/lib/api/tickets";
import type { Ticket } from "@/types/tickets";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
  Textarea,
} from "@/components/ui/base";
import { ArrowLeft, Loader2, MessageSquare, X } from "lucide-react";
import { toast } from "sonner";

function statusColor(status: string) {
  switch (status) {
    case "resolved":
    case "closed":
      return "secondary";
    case "in_progress":
      return "default";
    case "new":
    case "open":
      return "outline";
    default:
      return "outline";
  }
}

function TicketList({
  tickets,
  onSelect,
}: {
  tickets: Ticket[];
  onSelect: (t: Ticket) => void;
}) {
  if (tickets.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No tickets found for this email.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {tickets.map((t) => (
        <Card
          key={t.id}
          className="cursor-pointer transition-shadow hover:shadow-md"
          onClick={() => onSelect(t)}
        >
          <CardContent className="flex items-start justify-between gap-3 py-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{t.subject}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                #{t.ticket_number} · {new Date(t.created_at).toLocaleDateString()}
              </p>
            </div>
            <Badge variant={statusColor(t.status)}>{t.status.replace(/_/g, " ")}</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TicketDetail({
  ticket,
  emailToken,
  onBack,
}: {
  ticket: Ticket;
  emailToken: string;
  onBack: () => void;
}) {
  const qc = useQueryClient();
  const [comment, setComment] = useState("");

  const { data: fullTicket } = useQuery({
    queryKey: ["public-ticket", emailToken, ticket.id],
    queryFn: () => getCustomerTicket(emailToken, ticket.id),
    initialData: ticket,
  });

  const addComment = useMutation({
    mutationFn: (content: string) => addPublicComment(emailToken, ticket.id, content),
    onSuccess: () => {
      setComment("");
      qc.invalidateQueries({ queryKey: ["public-ticket", emailToken, ticket.id] });
      toast.success("Comment added");
    },
    onError: () => toast.error("Failed to add comment"),
  });

  const closeTicket = useMutation({
    mutationFn: () => closePublicTicket(emailToken, ticket.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customer-tickets", emailToken] });
      qc.invalidateQueries({ queryKey: ["public-ticket", emailToken, ticket.id] });
      toast.success("Ticket closed");
      onBack();
    },
    onError: () => toast.error("Failed to close ticket"),
  });

  const t = fullTicket ?? ticket;

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to tickets
      </button>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{t.subject}</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              #{t.ticket_number} · opened {new Date(t.created_at).toLocaleDateString()}
            </p>
          </div>
          <Badge variant={statusColor(t.status)}>{t.status.replace(/_/g, " ")}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{t.description}</p>

          {t.status !== "closed" && t.status !== "resolved" && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="flex items-center gap-1 text-sm font-medium">
                  <MessageSquare className="h-4 w-4" /> Add a comment
                </p>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Describe any additional details..."
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => addComment.mutate(comment)}
                    disabled={!comment.trim() || addComment.isPending}
                  >
                    {addComment.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                    Send
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => closeTicket.mutate()}
                    disabled={closeTicket.isPending}
                  >
                    <X className="mr-1 h-3 w-3" /> Close ticket
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CustomerTicketsPage() {
  const { emailToken } = useParams<{ emailToken: string }>();
  const [selected, setSelected] = useState<Ticket | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["customer-tickets", emailToken],
    queryFn: () => getCustomerTickets(emailToken),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="py-12 text-center text-sm text-destructive">
        Could not load your tickets. The link may be expired or invalid.
      </p>
    );
  }

  if (selected) {
    return (
      <TicketDetail
        ticket={selected}
        emailToken={emailToken}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold">Your support tickets</h2>
      <TicketList tickets={data?.data ?? []} onSelect={setSelected} />
    </div>
  );
}
