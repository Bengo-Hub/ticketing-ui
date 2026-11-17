"use client";

import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import {
  addComment,
  assignTicket,
  bulkUpdateTickets,
  createTicket,
  deleteTicket,
  getTicket,
  getTicketComments,
  getTickets,
  getTicketTags,
  mergeTicket,
  updateTicket,
  updateTicketStatus,
} from "@/lib/api/tickets";
import type {
  AddCommentData,
  CreateTicketData,
  CursorPage,
  TicketListParams,
  TicketStatus,
  UpdateTicketData,
} from "@/types/tickets";
import type { BulkUpdateData } from "@/types/workspace";
import { analyticsKey } from "@/hooks/useAnalytics";

/** Every row of the pages an infinite query has loaded, in order. */
export function flattenPages<T>(data?: InfiniteData<CursorPage<T>>): T[] {
  return data?.pages.flatMap((p) => p.data) ?? [];
}

const nextCursor = <T,>(last: CursorPage<T>) => (last.has_more && last.next_cursor ? last.next_cursor : undefined);

/**
 * The ticket list a keyset page at a time. The debounced search term is part of the key, so a
 * new term starts again from the first page; a newer request aborts the older one, and the rows
 * already on screen stay while the next term loads. Pages after the first load on "Load more".
 */
export function useTicketList(params: Omit<TicketListParams, "cursor" | "search">, term = "", enabled = true) {
  return useInfiniteQuery({
    queryKey: ["tickets", params, term],
    queryFn: ({ pageParam, signal }) =>
      getTickets({ ...params, search: term || undefined, cursor: pageParam || undefined }, signal),
    initialPageParam: "",
    getNextPageParam: nextCursor,
    placeholderData: keepPreviousData,
    enabled: enabled && !!params.tenantSlug,
    staleTime: 30_000,
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

/** A ticket's conversation, oldest first, a page at a time; later pages load on request. */
export function useTicketComments(tenantSlug: string, ticketId: string) {
  return useInfiniteQuery({
    queryKey: ["ticket-comments", tenantSlug, ticketId],
    queryFn: ({ pageParam }) => getTicketComments(tenantSlug, ticketId, pageParam || undefined),
    initialPageParam: "",
    getNextPageParam: nextCursor,
    enabled: !!tenantSlug && !!ticketId,
    staleTime: 30_000,
  });
}

/** Tags in use across the tenant, for the filter and the ticket's tag editor. Staff only. */
export function useTicketTags(tenantSlug: string, enabled = true) {
  return useQuery({
    queryKey: ["ticket-tags", tenantSlug],
    queryFn: () => getTicketTags(tenantSlug),
    enabled: enabled && !!tenantSlug,
    staleTime: 5 * 60_000,
  });
}

export function useCreateTicket(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTicketData) => createTicket(tenantSlug, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tickets"] });
      void qc.invalidateQueries({ queryKey: analyticsKey(tenantSlug) });
    },
  });
}

export function useUpdateTicket(tenantSlug: string, ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateTicketData) => updateTicket(tenantSlug, ticketId, data),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: ["ticket", tenantSlug, ticketId] });
      void qc.invalidateQueries({ queryKey: ["tickets"] });
      if (variables.tags) void qc.invalidateQueries({ queryKey: ["ticket-tags", tenantSlug] });
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
      void qc.invalidateQueries({ queryKey: analyticsKey(tenantSlug) });
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
      void qc.invalidateQueries({ queryKey: analyticsKey(tenantSlug) });
    },
  });
}

/** Changes many tickets at once. The response lists each ticket's outcome. */
export function useBulkUpdate(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkUpdateData) => bulkUpdateTickets(tenantSlug, data),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: ["tickets"] });
      void qc.invalidateQueries({ queryKey: analyticsKey(tenantSlug) });
      for (const id of variables.ids) void qc.invalidateQueries({ queryKey: ["ticket", tenantSlug, id] });
      if (variables.add_tags?.length) void qc.invalidateQueries({ queryKey: ["ticket-tags", tenantSlug] });
    },
  });
}

/** Merges `id` into another ticket. Both tickets and their threads change. */
export function useMergeTicket(tenantSlug: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (intoTicketId: string) => mergeTicket(tenantSlug, id, intoTicketId),
    onSuccess: (target) => {
      for (const t of [id, target.id]) {
        void qc.invalidateQueries({ queryKey: ["ticket", tenantSlug, t] });
        void qc.invalidateQueries({ queryKey: ["ticket-comments", tenantSlug, t] });
        void qc.invalidateQueries({ queryKey: ["ticket-attachments", tenantSlug, t] });
      }
      void qc.invalidateQueries({ queryKey: ["tickets"] });
      void qc.invalidateQueries({ queryKey: analyticsKey(tenantSlug) });
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
