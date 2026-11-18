import { api } from "@/lib/api-client";
import type {
  ChannelSettings,
  ChannelSettingsInput,
  CsatSettings,
  HelpCenterSettings,
} from "@/types/settings";

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

/** Needs ticketing.settings.manage. */
export async function getCsatSettings(tenantSlug: string): Promise<CsatSettings> {
  const { data } = await api.get<CsatSettings>(`api/v1/${tenantSlug}/settings/csat`);
  return data;
}

/** Needs ticketing.settings.manage. A field left out keeps its value; returns the saved settings. */
export async function updateCsatSettings(tenantSlug: string, payload: Partial<CsatSettings>): Promise<CsatSettings> {
  const { data } = await api.put<CsatSettings>(`api/v1/${tenantSlug}/settings/csat`, payload);
  return data;
}

/** Platform owner only (403 for everyone else). The slug only routes the call. */
export async function getHelpCenterSettings(tenantSlug: string): Promise<HelpCenterSettings> {
  const { data } = await api.get<HelpCenterSettings>(`api/v1/${tenantSlug}/platform/settings/help-center`);
  return data;
}

/** Platform owner only. Every replica of the API applies the change within 30 seconds. */
export async function updateHelpCenterSettings(
  tenantSlug: string,
  payload: HelpCenterSettings,
): Promise<HelpCenterSettings> {
  const { data } = await api.put<HelpCenterSettings>(`api/v1/${tenantSlug}/platform/settings/help-center`, payload);
  return data;
}
