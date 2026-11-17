"use client";

import { useParams } from "next/navigation";
import { Settings } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button, Card, CardContent } from "@/components/ui/base";
import { useChannelSettings } from "@/hooks/useChannelSettings";
import { useServicePermissions } from "@/hooks/useServicePermissions";
import { useT } from "@/hooks/useT";
import { PERM } from "@/lib/rbac/permissions";
import { orgRoute } from "@/lib/utils";
import { AiSettingsCard } from "./ai-settings";
import { EmailChannel } from "./email-channel";
import { WhatsAppChannel } from "./whatsapp-channel";
import { WidgetChannel } from "./widget-channel";

export default function AdminSettingsPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const { t } = useT();
  const { can, isLoading: permsLoading } = useServicePermissions(orgSlug);
  const canManage = can(PERM.settingsManage);
  const { data, isLoading, isError, isRefetching, refetch } = useChannelSettings(orgSlug, canManage);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader
        back={{ href: orgRoute(orgSlug, "/admin"), label: t("nav.admin") }}
        icon={Settings}
        title={t("settings.title")}
        subtitle={t("settings.subtitle")}
      />

      {!canManage && !permsLoading ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">{t("settings.noAccess")}</CardContent>
        </Card>
      ) : (
        <section className="space-y-4" aria-labelledby="settings-channels">
          <div>
            <h2 id="settings-channels" className="text-lg font-semibold">
              {t("settings.channels")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("settings.channelsHint")}</p>
          </div>

          {isLoading || permsLoading ? (
            <div className="space-y-4" aria-busy="true">
              <div className="h-56 animate-pulse rounded-lg bg-muted" />
              <div className="h-32 animate-pulse rounded-lg bg-muted" />
            </div>
          ) : isError || !data ? (
            <Card>
              <CardContent className="flex flex-col items-start gap-3 p-6">
                <p className="text-sm text-muted-foreground">{t("settings.loadFailed")}</p>
                <Button variant="outline" onClick={() => void refetch()}>
                  {t("common.retry")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <EmailChannel
                address={data.email?.forwarding_address ?? ""}
                lastReceivedAt={data.email?.last_received_at ?? null}
                refreshing={isRefetching}
                onRefresh={() => void refetch()}
              />
              <WhatsAppChannel orgSlug={orgSlug} settings={data} />
            </>
          )}
          {!permsLoading && <WidgetChannel orgSlug={orgSlug} />}
        </section>
      )}

      {canManage && !permsLoading && (
        <section className="space-y-4" aria-labelledby="settings-ai">
          <div>
            <h2 id="settings-ai" className="text-lg font-semibold">
              {t("ai.settings.section")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("ai.settings.sectionHint")}</p>
          </div>
          <AiSettingsCard orgSlug={orgSlug} />
        </section>
      )}
    </div>
  );
}
