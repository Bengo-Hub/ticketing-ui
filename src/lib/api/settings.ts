import { api } from "@/lib/api-client";
import type { ChannelSettings, ChannelSettingsInput } from "@/types/settings";

/** Needs ticketing.settings.manage. */
export async function getChannelSettings(tenantSlug: string): Promise<ChannelSettings> {
  const { data } = await api.get<ChannelSettings>(`api/v1/${tenantSlug}/settings/channels`);
  return data;
}

/** Replaces the whole channels section, so the body always carries every stored field. */
export async function updateChannelSettings(
  tenantSlug: string,
  payload: ChannelSettingsInput,
): Promise<ChannelSettings> {
  const { data } = await api.put<ChannelSettings>(`api/v1/${tenantSlug}/settings/channels`, payload);
  return data;
}
