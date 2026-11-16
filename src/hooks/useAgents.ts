"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type DirectoryListParams,
  createAgent,
  createTeam,
  deleteAgent,
  deleteTeam,
  getAgents,
  getTeams,
  updateAgent,
  updateTeam,
} from "@/lib/api/agents";
import type { CreateAgentData, CreateTeamData, UpdateAgentData, UpdateTeamData } from "@/types/agents";

/** Agents page by page. Pickers pass `{ limit: 100 }`, the API's largest page. */
export function useAgents(tenantSlug: string, params: DirectoryListParams = {}, enabled = true) {
  return useQuery({
    queryKey: ["agents", tenantSlug, params],
    queryFn: () => getAgents(tenantSlug, params),
    enabled: enabled && !!tenantSlug,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });
}

export function useTeams(
  tenantSlug: string,
  params: Pick<DirectoryListParams, "page" | "limit" | "active"> = {},
  enabled = true,
) {
  return useQuery({
    queryKey: ["teams", tenantSlug, params],
    queryFn: () => getTeams(tenantSlug, params),
    enabled: enabled && !!tenantSlug,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });
}

export function useCreateAgent(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAgentData) => createAgent(tenantSlug, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["agents", tenantSlug] });
    },
  });
}

export function useUpdateAgent(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAgentData }) =>
      updateAgent(tenantSlug, id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["agents", tenantSlug] });
    },
  });
}

export function useDeleteAgent(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAgent(tenantSlug, id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["agents", tenantSlug] });
    },
  });
}

export function useCreateTeam(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTeamData) => createTeam(tenantSlug, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["teams", tenantSlug] });
    },
  });
}

export function useUpdateTeam(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTeamData }) =>
      updateTeam(tenantSlug, id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["teams", tenantSlug] });
    },
  });
}

export function useDeleteTeam(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTeam(tenantSlug, id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["teams", tenantSlug] });
    },
  });
}
