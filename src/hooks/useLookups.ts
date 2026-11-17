"use client";

import { useCallback, useMemo } from "react";
import type { ComboboxOption } from "@bengo-hub/shared-ui-lib/combobox";
import { useAgents, useTeams } from "@/hooks/useAgents";
import { useCategories } from "@/hooks/useCategories";
import { useServicePermissions } from "@/hooks/useServicePermissions";
import { PERM } from "@/lib/rbac/permissions";

/** Pickers list people and teams alphabetically; the API pages them newest first. */
const byLabel = (a: ComboboxOption, b: ComboboxOption) => a.label.localeCompare(b.label);

/**
 * Agents, teams and categories as picker options and id-to-name lookups. The directory lists are
 * fetched only for people allowed to read them; a tenant's directory fits in one page of 100.
 */
export function useLookups(orgSlug: string) {
  const { can } = useServicePermissions(orgSlug);
  const canAgents = can(PERM.agentsView, PERM.agentsManage);
  const canTeams = can(PERM.teamsView, PERM.teamsManage);

  const agents = useAgents(orgSlug, { limit: 100 }, canAgents);
  const teams = useTeams(orgSlug, { limit: 100 }, canTeams);
  const categories = useCategories(orgSlug);

  const agentRows = agents.data?.data;
  const teamRows = teams.data?.data;
  const categoryRows = categories.data;

  const agentOptions = useMemo<ComboboxOption[]>(
    () =>
      (agentRows ?? [])
        .filter((a) => a.is_active)
        .map((a) => ({ value: a.id, label: a.display_name, hint: a.status, description: a.email }))
        .sort(byLabel),
    [agentRows],
  );
  const teamOptions = useMemo<ComboboxOption[]>(
    () =>
      (teamRows ?? [])
        .filter((t) => t.is_active)
        .map((t) => ({ value: t.id, label: t.name }))
        .sort(byLabel),
    [teamRows],
  );
  const categoryOptions = useMemo<ComboboxOption[]>(
    () => (categoryRows ?? []).filter((c) => c.is_active).map((c) => ({ value: c.id, label: c.name })),
    [categoryRows],
  );

  const agentName = useCallback(
    (id?: string) => (id ? agentRows?.find((a) => a.id === id)?.display_name : undefined),
    [agentRows],
  );
  const teamName = useCallback(
    (id?: string) => (id ? teamRows?.find((t) => t.id === id)?.name : undefined),
    [teamRows],
  );
  const categoryName = useCallback(
    (id?: string) => (id ? categoryRows?.find((c) => c.id === id)?.name : undefined),
    [categoryRows],
  );

  return {
    agents: agentRows ?? [],
    teams: teamRows ?? [],
    categories: categoryRows ?? [],
    agentOptions,
    teamOptions,
    categoryOptions,
    agentName,
    teamName,
    categoryName,
  };
}
