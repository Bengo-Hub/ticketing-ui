// Mirrors ticketing-api internal/modules/settings (channels.go and handler.go). Field names are
// the wire names.

/** WhatsApp intake settings (settings.WhatsAppChannel). */
export interface WhatsAppChannelSettings {
  /** Opens a ticket for a WhatsApp message that does not continue an open one. Off by default. */
  auto_ticket: boolean;
}

/** The stored channel settings, the body of PUT /settings/channels (settings.Channels). */
export interface ChannelSettingsInput {
  whatsapp: WhatsAppChannelSettings;
}

/**
 * The GET and PUT response: the stored settings plus the email forwarding address, which the API
 * derives from the tenant slug and never stores. The address is empty when email intake is off.
 * `last_received_at` (RFC3339) is when the last forwarded email reached the tenant, null until
 * the first one arrives. Neither is ever sent back in a PUT body.
 */
export interface ChannelSettings extends ChannelSettingsInput {
  email: {
    forwarding_address: string;
    last_received_at?: string | null;
  };
}

/**
 * The tenant's CSAT survey settings (settings.CSATSettings, GET and PUT /settings/csat). On with a
 * 7 day link until the tenant changes them. A PUT may leave a field out to keep its value.
 */
export interface CsatSettings {
  /** Emails a satisfaction survey when a ticket with a requester email is resolved. */
  enabled: boolean;
  /** How many days the survey link works after the resolve, 1 to 30. */
  link_valid_days: number;
}

/** The bounds the API enforces on link_valid_days. */
export const CSAT_LINK_DAYS_MIN = 1;
export const CSAT_LINK_DAYS_MAX = 30;

/** The public knowledge base limits, per tenant and visitor (settings.HelpCenterLimits). */
export interface HelpCenterLimits {
  /** Article list, one article and the categories. */
  read_per_minute: number;
  suggest_per_minute: number;
  view_per_minute: number;
  vote_per_hour: number;
}

/**
 * The platform help center settings (settings.HelpCenterSettings), one value for every tenant.
 * Only the platform owner reads or changes them (GET and PUT /platform/settings/help-center).
 */
export interface HelpCenterSettings {
  /** How long the help center page keeps an article on this app's server, 0 to 3600. */
  article_cache_seconds: number;
  limits: HelpCenterLimits;
}

/** The bounds the API enforces on the help center settings. */
export const HELP_CENTER_CACHE_MAX = 3600;
export const HELP_CENTER_LIMIT_MIN = 1;
export const HELP_CENTER_LIMIT_MAX = 10000;
