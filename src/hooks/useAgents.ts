"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAgent,
  createTeam,
  deleteAgent,
  deleteTeam,
  getAgents,
  getTeams,
  updateAgent,
  updateTeam,
} from "@/lib/api/agents";
import type { CreateAgentData, CreateTeamData } from "@/types/agents";

export function useAgents(tenantSlug: string) {
  return useQuery({
    queryKey: ["agents", tenantSlug],
    queryFn: () => getAgents(tenantSlug),
    enabled: !!tenantSlug,
    staleTime: 5 * 60_000,
  });
}

export function useTeams(tenantSlug: string) {
  return useQuery({
    queryKey: ["teams", tenantSlug],
    queryFn: () => getTeams(tenantSlug),
    enabled: !!tenantSlug,
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
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAgentData> }) =>
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
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTeamData> }) =>
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
