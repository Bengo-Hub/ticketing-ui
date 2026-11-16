"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addComment,
  assignTicket,
  createTicket,
  getCategories,
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
    queryFn: () => getTickets(params),
    enabled: enabled && !!params.tenantSlug,
    staleTime: 60_000,
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

export function useTicketStats(tenantSlug: string) {
  return useQuery({
    queryKey: ["ticket-stats", tenantSlug],
    queryFn: () => getTicketStats(tenantSlug),
    enabled: !!tenantSlug,
    staleTime: 60_000,
  });
}

export function useCategories(tenantSlug: string) {
  return useQuery({
    queryKey: ["categories", tenantSlug],
    queryFn: () => getCategories(tenantSlug),
    enabled: !!tenantSlug,
    staleTime: 10 * 60_000,
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

export function useAddComment(tenantSlug: string, ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AddCommentData) => addComment(tenantSlug, ticketId, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["ticket-comments", tenantSlug, ticketId] });
    },
  });
}

export function useTicketAnalytics(tenantSlug: string, days = 30) {
  return useQuery({
    queryKey: ["ticket-analytics", tenantSlug, days],
    queryFn: () => getTicketAnalytics(tenantSlug, days),
  });
}
