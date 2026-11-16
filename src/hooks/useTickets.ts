"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchQuery } from "@bengo-hub/shared-ui-lib/search/query";
import {
  addComment,
  assignTicket,
  createTicket,
  deleteTicket,
  getTicket,
  getTicketAnalytics,
  getTicketComments,
  getTickets,
  getTicketStats,
  updateTicket,
  updateTicketStatus,
} from "@/lib/api/tickets";
import type {
  AddCommentData,
  CreateTicketData,
  TicketListParams,
  TicketStatus,
  UpdateTicketData,
} from "@/types/tickets";

export function useTickets(params: TicketListParams, enabled = true) {
  return useQuery({
    queryKey: ["tickets", params],
    queryFn: ({ signal }) => getTickets(params, signal),
    enabled: enabled && !!params.tenantSlug,
    staleTime: 60_000,
  });
}

/**
 * The ticket list driven by a debounced search term: the term is part of the key, a newer term
 * aborts the older request and the previous page stays on screen while the next one loads.
 */
export function useTicketSearch(params: Omit<TicketListParams, "search">, term: string) {
  return useSearchQuery({
    queryKey: ["tickets", params],
    term,
    fetcher: (search, signal) => getTickets({ ...params, search: search || undefined }, signal),
    enabled: !!params.tenantSlug,
  });
}

export function useTicket(tenantSlug: string, id: string) {
  return useQuery({
    queryKey: ["ticket", tenantSlug, id],
    queryFn: () => getTicket(tenantSlug, id),
    enabled: !!tenantSlug && !!id,
    staleTime: 30_000,
  });
}

export function useTicketComments(tenantSlug: string, ticketId: string) {
  return useQuery({
    queryKey: ["ticket-comments", tenantSlug, ticketId],
    queryFn: () => getTicketComments(tenantSlug, ticketId),
    enabled: !!tenantSlug && !!ticketId,
    staleTime: 30_000,
  });
}

export function useTicketStats(tenantSlug: string, enabled = true) {
  return useQuery({
    queryKey: ["ticket-stats", tenantSlug],
    queryFn: () => getTicketStats(tenantSlug),
    enabled: enabled && !!tenantSlug,
    staleTime: 60_000,
  });
}

export function useCreateTicket(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTicketData) => createTicket(tenantSlug, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tickets"] });
      void qc.invalidateQueries({ queryKey: ["ticket-stats", tenantSlug] });
    },
  });
}

export function useUpdateTicket(tenantSlug: string, ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateTicketData) => updateTicket(tenantSlug, ticketId, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["ticket", tenantSlug, ticketId] });
      void qc.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
}

export function useUpdateTicketStatus(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TicketStatus }) =>
      updateTicketStatus(tenantSlug, id, status),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: ["ticket", tenantSlug, variables.id] });
      void qc.invalidateQueries({ queryKey: ["tickets"] });
      void qc.invalidateQueries({ queryKey: ["ticket-stats", tenantSlug] });
    },
  });
}

export function useAssignTicket(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, agentId, teamId }: { id: string; agentId?: string; teamId?: string }) =>
      assignTicket(tenantSlug, id, { agentId, teamId }),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: ["ticket", tenantSlug, variables.id] });
      void qc.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
}

export function useDeleteTicket(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTicket(tenantSlug, id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tickets"] });
      void qc.invalidateQueries({ queryKey: ["ticket-stats", tenantSlug] });
    },
  });
}

export function useAddComment(tenantSlug: string, ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AddCommentData) => addComment(tenantSlug, ticketId, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["ticket-comments", tenantSlug, ticketId] });
      void qc.invalidateQueries({ queryKey: ["ticket", tenantSlug, ticketId] });
    },
  });
}

export function useTicketAnalytics(tenantSlug: string, days = 30, enabled = true) {
  return useQuery({
    queryKey: ["ticket-analytics", tenantSlug, days],
    queryFn: () => getTicketAnalytics(tenantSlug, days),
    enabled: enabled && !!tenantSlug,
    staleTime: 60_000,
  });
}
