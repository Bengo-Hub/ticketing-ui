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
