"use client";

import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { SwitchField } from "@/components/common/field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/base";
import { useUpdateChannelSettings } from "@/hooks/useChannelSettings";
import { useT } from "@/hooks/useT";
import type { ChannelSettings } from "@/types/settings";

/** The WhatsApp channel: the auto-ticketing switch, saved as soon as it is flipped. */
export function WhatsAppChannel({ orgSlug, settings }: { orgSlug: string; settings: ChannelSettings }) {
  const { t } = useT();
  const update = useUpdateChannelSettings(orgSlug);
  // While a save is in flight the switch shows the value being saved.
  const autoTicket = update.isPending && update.variables ? update.variables.whatsapp.auto_ticket : settings.whatsapp.auto_ticket;

  const onChange = async (next: boolean) => {
    try {
      await update.mutateAsync({ whatsapp: { ...settings.whatsapp, auto_ticket: next } });
      toast.success(t("settings.whatsapp.saved"));
    } catch {
      toast.error(t("settings.whatsapp.saveFailed"));
    }
  };

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle className="h-4 w-4 text-primary" />
          {t("settings.whatsapp.title")}
        </CardTitle>
        <CardDescription>{t("settings.whatsapp.intro")}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        <SwitchField
          label={t("settings.whatsapp.autoTicket")}
          description={autoTicket ? t("settings.whatsapp.autoTicketOn") : t("settings.whatsapp.autoTicketOff")}
          checked={autoTicket}
          onChange={(next) => void onChange(next)}
          disabled={update.isPending}
        />
        <p className="mt-3 text-xs text-muted-foreground">{t("settings.whatsapp.convertNote")}</p>
      </CardContent>
    </Card>
  );
}
