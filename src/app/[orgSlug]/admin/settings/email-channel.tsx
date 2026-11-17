"use client";

import { CircleCheck, Hourglass, Loader2, Mail, RefreshCw } from "lucide-react";
import { CopyButton } from "@/components/common/copy-button";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/base";
import { useT } from "@/hooks/useT";
import type { MessageKey } from "@/lib/i18n";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";

/**
 * The platform tenant's own support mailbox. Mail to it arrives directly, so the platform has
 * nothing to forward and sees no forwarding steps.
 */
const PLATFORM_MAILBOX = "support@codevertexafrica.com";

/** The auto-forward steps for each mail provider, as message keys in display order. */
const PROVIDERS: { title: MessageKey; steps: MessageKey[] }[] = [
  {
    title: "settings.email.gmailTitle",
    steps: ["settings.email.gmail1", "settings.email.gmail2", "settings.email.gmail3", "settings.email.gmail4"],
  },
  {
    title: "settings.email.outlookTitle",
    steps: ["settings.email.outlook1", "settings.email.outlook2", "settings.email.outlook3", "settings.email.outlook4"],
  },
  {
    title: "settings.email.cpanelTitle",
    steps: ["settings.email.cpanel1", "settings.email.cpanel2", "settings.email.cpanel3"],
  },
];

/**
 * Whether forwarding works: waiting until the first forwarded email reaches the tenant, then
 * working with the time of the latest one. Refresh reloads the channel settings.
 */
function VerificationStatus({
  lastReceivedAt,
  direct,
  address,
  refreshing,
  onRefresh,
}: {
  lastReceivedAt: string | null;
  direct: boolean;
  address: string;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const { t } = useT();
  const refresh = (
    <Button type="button" variant="outline" size="sm" onClick={onRefresh} disabled={refreshing} className="shrink-0">
      {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
      {t("settings.email.refresh")}
    </Button>
  );

  if (lastReceivedAt) {
    return (
      <div
        role="status"
        className="flex flex-col gap-3 rounded-lg border border-green-200 bg-green-50 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-green-900/50 dark:bg-green-900/20"
      >
        <div className="flex min-w-0 items-start gap-2">
          <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-green-800 dark:text-green-300">{t("settings.email.working")}</p>
            <p className="text-xs text-muted-foreground" title={formatDateTime(lastReceivedAt)}>
              {t("settings.email.lastReceived", { when: formatRelativeTime(lastReceivedAt), at: formatDateTime(lastReceivedAt) })}
            </p>
          </div>
        </div>
        {refresh}
      </div>
    );
  }

  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-lg border border-warning/40 bg-warning/10 p-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-start gap-2">
        <Hourglass className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
        <div className="min-w-0">
          <p className="text-sm font-semibold">{t("settings.email.waiting")}</p>
          <p className="text-xs text-muted-foreground wrap-break-word">
            {direct ? t("settings.email.waitingDirect", { address }) : t("settings.email.waitingHint")}
          </p>
        </div>
      </div>
      {refresh}
    </div>
  );
}

/**
 * The email channel: the forwarding address with a copy button, whether forwarding works, and
 * how to forward to it. The platform tenant receives on the address itself and skips the steps.
 */
export function EmailChannel({
  address,
  lastReceivedAt,
  refreshing,
  onRefresh,
}: {
  address: string;
  lastReceivedAt: string | null;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const { t } = useT();
  const direct = address.trim().toLowerCase() === PLATFORM_MAILBOX;

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4 text-primary" />
          {t("settings.email.title")}
        </CardTitle>
        <CardDescription>{direct ? t("settings.email.introDirect") : t("settings.email.intro")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 p-4 pt-0 sm:p-6 sm:pt-0">
        {address ? (
          <>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">
                {direct ? t("settings.email.mailboxLabel") : t("settings.email.addressLabel")}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <code className="min-w-0 flex-1 break-all rounded-md border border-border bg-muted px-3 py-2 font-mono text-sm">
                  {address}
                </code>
                <CopyButton text={address} ariaLabel={t("settings.email.copyAria")} copiedToast={t("settings.email.copied")} />
              </div>
            </div>

            <VerificationStatus
              lastReceivedAt={lastReceivedAt}
              direct={direct}
              address={address}
              refreshing={refreshing}
              onRefresh={onRefresh}
            />

            {!direct && (
              <div className="space-y-3">
                <p className="text-sm font-medium">{t("settings.email.howTo")}</p>
                {PROVIDERS.map((p) => (
                  <section key={p.title} className="rounded-lg border border-border p-3">
                    <h3 className="text-sm font-semibold">{t(p.title)}</h3>
                    <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                      {p.steps.map((s) => (
                        <li key={s} className="break-words">
                          {t(s)}
                        </li>
                      ))}
                    </ol>
                  </section>
                ))}
                <p className="text-xs text-muted-foreground">{t("settings.email.newMailOnly")}</p>
              </div>
            )}

            <p className="rounded-md bg-muted/60 p-3 text-sm">{t("settings.email.replies")}</p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{t("settings.email.notConfigured")}</p>
        )}
      </CardContent>
    </Card>
  );
}
