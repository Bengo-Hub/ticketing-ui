// Mirrors ticketing-api internal/modules/ai (domain.go) and docs/ai.md. Field names are the wire
// names. review_notes, tainted and injected are optional so an older API still type-checks.

import type { KBArticle } from "@/types/kb";
import type { TicketPriority } from "@/types/tickets";

/** What one AI request cost the tenant's prepaid AI credit wallet. */
export interface AiCredits {
  /** 1, or 0 for the platform owner and for a repeated Idempotency-Key. */
  charged: number;
  /** True for the platform owner, who is never charged. */
  exempt: boolean;
  /** True when the request key had already been answered or paid. */
  replayed: boolean;
}

/** How the marketflow-ai run ended. */
export interface AiRun {
  /** True when the run stopped before it finished, so the text may be partial. */
  stopped_early: boolean;
  stop_reason?: string;
}

/** Fields every ticket-scoped AI answer shares (summary, reply, KB suggestions, KB draft). */
export interface AiTicketAnswer {
  ticket_id: string;
  run: AiRun;
  credits: AiCredits;
  /** Advice from marketflow-ai's figure and commitment checks. May be empty or absent. */
  review_notes?: string[];
  /** True when the text was built from ticket content marketflow-ai flagged as untrusted. */
  tainted?: boolean;
}

export interface AiClassifyRequest {
  subject: string;
  description: string;
  channel?: string;
}

export interface AiClassification {
  /** marketflow-ai's label: billing, technical, product or general. */
  label: string;
  category: { id: string; name: string } | null;
  /** low, normal, high or urgent. */
  priority: TicketPriority;
  team: { id: string } | null;
  confidence: number;
  reasoning: string;
  /** True below 0.85 confidence, and always when `injected` is true. */
  requires_human_review: boolean;
  /** True when the draft carried an injection phrase. Nothing is preselected then. */
  injected?: boolean;
  credits: AiCredits;
}

export interface AiSummary extends AiTicketAnswer {
  summary: string;
}

export interface AiReply extends AiTicketAnswer {
  reply: string;
}

export interface AiKBSuggestion {
  article_id: string;
  title: string;
  slug: string;
  excerpt?: string;
  /** Whether the article can be linked for the customer; a private one is for the agent only. */
  is_public: boolean;
  reason?: string;
  rank: number;
}

export interface AiKBSuggestions extends AiTicketAnswer {
  suggestions: AiKBSuggestion[];
}

/** The saved draft article, in the same shape as the KB routes (KBArticle). */
export type AiDraftArticle = Pick<KBArticle, "id" | "title" | "slug" | "status" | "is_public">;

export interface AiKBDraft extends AiTicketAnswer {
  article: AiDraftArticle;
}

/** GET and PUT /settings/ai. */
export interface AiSettings {
  /** Classify every new ticket after it is saved, at 1 AI credit per ticket. Off by default. */
  auto_classify: boolean;
}

/** Payload of the SSE event ticket.ai_classified. */
export interface AiClassifiedEvent {
  ticket_id: string;
  classification: AiClassification;
}
