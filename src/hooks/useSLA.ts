"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCalendar,
  createSLAPolicy,
  deleteCalendar,
  deleteSLAPolicy,
  getCalendars,
  getSLAPolicies,
  getSLAPolicy,
  getSLAReport,
  updateCalendar,
  updateSLAPolicy,
} from "@/lib/api/sla";
import type {
  CalendarInput,
  CreateSLAPolicyData,
  SLAPolicyListParams,
  SLAReportParams,
  UpdateSLAPolicyData,
} from "@/types/sla";

export function useSLAPolicies(params: SLAPolicyListParams) {
  return useQuery({
    queryKey: ["sla-policies", params],
    queryFn: () => getSLAPolicies(params),
    enabled: !!params.tenantSlug,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

/** One policy, for the ticket's SLA panel. Only people who may read SLA settings fetch it. */
export function useSLAPolicy(tenantSlug: string, id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["sla-policy", tenantSlug, id],
    queryFn: () => getSLAPolicy(tenantSlug, id as string),
    enabled: enabled && !!tenantSlug && !!id,
    staleTime: 5 * 60_000,
  });
}

export function useCreateSLAPolicy(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSLAPolicyData) => createSLAPolicy(tenantSlug, data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["sla-policies"] }),
  });
}

export function useUpdateSLAPolicy(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSLAPolicyData }) => updateSLAPolicy(tenantSlug, id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["sla-policies"] });
      void qc.invalidateQueries({ queryKey: ["sla-policy"] });
    },
  });
}

export function useDeleteSLAPolicy(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSLAPolicy(tenantSlug, id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["sla-policies"] }),
  });
}

/** A tenant's calendars; a handful at most, so pickers read one page of 100. */
export function useCalendars(tenantSlug: string, page = 1, limit = 100, enabled = true) {
  return useQuery({
    queryKey: ["sla-calendars", tenantSlug, page, limit],
    queryFn: () => getCalendars(tenantSlug, { page, limit }),
    enabled: enabled && !!tenantSlug,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

export function useSaveCalendar(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: CalendarInput }) =>
      id ? updateCalendar(tenantSlug, id, data) : createCalendar(tenantSlug, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["sla-calendars"] });
      // Tickets carry their calendar's name, so an open ticket shows a rename at once.
      void qc.invalidateQueries({ queryKey: ["ticket"] });
    },
  });
}

export function useDeleteCalendar(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCalendar(tenantSlug, id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["sla-calendars"] }),
  });
}

export function useSLAReport(tenantSlug: string, params: SLAReportParams, enabled = true) {
  return useQuery({
    queryKey: ["sla-report", tenantSlug, params],
    queryFn: () => getSLAReport(tenantSlug, params),
    enabled: enabled && !!tenantSlug,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}
