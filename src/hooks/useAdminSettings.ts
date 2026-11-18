"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCsatSettings,
  getHelpCenterSettings,
  updateCsatSettings,
  updateHelpCenterSettings,
} from "@/lib/api/settings";
import type { CsatSettings, HelpCenterSettings } from "@/types/settings";

const csatSettingsKey = (tenantSlug: string) => ["csat-settings", tenantSlug] as const;
const helpCenterSettingsKey = ["help-center-settings"] as const;

/** The tenant's CSAT survey settings. Only settings managers fetch it. */
export function useCsatSettings(tenantSlug: string, enabled = true) {
  return useQuery({
    queryKey: csatSettingsKey(tenantSlug),
    queryFn: () => getCsatSettings(tenantSlug),
    enabled: enabled && !!tenantSlug,
    staleTime: 60_000,
  });
}

/** Saves the CSAT settings and keeps the API's answer as the cached copy. */
export function useUpdateCsatSettings(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CsatSettings>) => updateCsatSettings(tenantSlug, data),
    onSuccess: (saved) => qc.setQueryData(csatSettingsKey(tenantSlug), saved),
  });
}

/** The platform help center settings. Only the platform owner fetches it. */
export function useHelpCenterSettings(tenantSlug: string, enabled = true) {
  return useQuery({
    queryKey: helpCenterSettingsKey,
    queryFn: () => getHelpCenterSettings(tenantSlug),
    enabled: enabled && !!tenantSlug,
    staleTime: 60_000,
  });
}

/** Saves the platform help center settings and keeps the API's answer as the cached copy. */
export function useUpdateHelpCenterSettings(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: HelpCenterSettings) => updateHelpCenterSettings(tenantSlug, data),
    onSuccess: (saved) => qc.setQueryData(helpCenterSettingsKey, saved),
  });
}
