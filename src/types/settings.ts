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
 */
export interface ChannelSettings extends ChannelSettingsInput {
  email: {
    forwarding_address: string;
  };
}
