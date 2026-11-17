"use client";

import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CursorPage } from "@/types/tickets";
import {
  type DirectoryListParams,
  createAgent,
  createTeam,
  deleteAgent,
  deleteTeam,
  getAgents,
  getAvailableAgents,
  getTeams,
  updateAgent,
  updateTeam,
} from "@/lib/api/agents";
import type { CreateAgentData, CreateTeamData, UpdateAgentData, UpdateTeamData } from "@/types/agents";

const nextCursor = <T,>(last: CursorPage<T>) => (last.has_more && last.next_cursor ? last.next_cursor : undefined);

/**
 * The first keyset page of agents, newest first, for pickers and lookups. They pass
 * `{ limit: 100 }`, the API's largest page; `has_more` says whether the tenant has more.
 */
export function useAgents(tenantSlug: string, params: DirectoryListParams = {}, enabled = true) {
  return useQuery({
    queryKey: ["agents", tenantSlug, "first", params],
    queryFn: ({ signal }) => getAgents(tenantSlug, params, undefined, signal),
    enabled: enabled && !!tenantSlug,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });
}

/** The agent list a keyset page at a time, newest first; later pages load on "Load more". */
export function useAgentList(tenantSlug: string, params: DirectoryListParams = {}, enabled = true) {
  return useInfiniteQuery({
    queryKey: ["agents", tenantSlug, "list", params],
    queryFn: ({ pageParam, signal }) => getAgents(tenantSlug, params, pageParam || undefined, signal),
    initialPageParam: "",
    getNextPageParam: nextCursor,
    enabled: enabled && !!tenantSlug,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

/** The team list a keyset page at a time, newest first; later pages load on "Load more". */
export function useTeamList(
  tenantSlug: string,
  params: Pick<DirectoryListParams, "limit" | "active"> = {},
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: ["teams", tenantSlug, "list", params],
    queryFn: ({ pageParam, signal }) => getTeams(tenantSlug, params, pageParam || undefined, signal),
    initialPageParam: "",
    getNextPageParam: nextCursor,
    enabled: enabled && !!tenantSlug,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

/** Agents available for assignment, least loaded first. */
export function useAvailableAgents(tenantSlug: string, enabled = true) {
  return useQuery({
    queryKey: ["agents-available", tenantSlug],
    queryFn: () => getAvailableAgents(tenantSlug),
    enabled: enabled && !!tenantSlug,
    staleTime: 60_000,
  });
}

/** The first keyset page of teams, newest first, for pickers, lookups and the dashboard count. */
export function useTeams(
  tenantSlug: string,
  params: Pick<DirectoryListParams, "limit" | "active"> = {},
  enabled = true,
) {
  return useQuery({
    queryKey: ["teams", tenantSlug, "first", params],
    queryFn: ({ signal }) => getTeams(tenantSlug, params, undefined, signal),
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
