"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getChannelSettings, updateChannelSettings } from "@/lib/api/settings";
import type { ChannelSettingsInput } from "@/types/settings";

const channelSettingsKey = (tenantSlug: string) => ["channel-settings", tenantSlug] as const;

/** The tenant's channel settings and email forwarding address. Only settings managers fetch it. */
export function useChannelSettings(tenantSlug: string, enabled = true) {
  return useQuery({
    queryKey: channelSettingsKey(tenantSlug),
    queryFn: () => getChannelSettings(tenantSlug),
    enabled: enabled && !!tenantSlug,
    staleTime: 60_000,
  });
}

/** Saves the channel settings and keeps the answer the API sends back as the cached copy. */
export function useUpdateChannelSettings(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ChannelSettingsInput) => updateChannelSettings(tenantSlug, data),
    onSuccess: (saved) => qc.setQueryData(channelSettingsKey(tenantSlug), saved),
  });
}
