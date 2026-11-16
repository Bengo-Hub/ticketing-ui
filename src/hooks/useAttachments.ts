"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteAttachment, getAttachments, uploadAttachment, type UploadOptions } from "@/lib/api/workspace";

/** A ticket's files, oldest first, a page at a time. Customers never get internal ones. */
export function useAttachments(slug: string, ticketId: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: ["ticket-attachments", slug, ticketId],
    queryFn: ({ pageParam }) => getAttachments(slug, ticketId, pageParam || undefined),
    initialPageParam: "",
    getNextPageParam: (last) => (last.has_more && last.next_cursor ? last.next_cursor : undefined),
    enabled: enabled && !!slug && !!ticketId,
    staleTime: 60_000,
  });
}

export function useUploadAttachment(slug: string, ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, opts }: { file: File; opts?: UploadOptions }) => uploadAttachment(slug, ticketId, file, opts),
    onSettled: () => void qc.invalidateQueries({ queryKey: ["ticket-attachments", slug, ticketId] }),
  });
}

export function useDeleteAttachment(slug: string, ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: string) => deleteAttachment(slug, ticketId, attachmentId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["ticket-attachments", slug, ticketId] }),
  });
}
