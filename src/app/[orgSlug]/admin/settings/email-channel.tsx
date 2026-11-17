"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/base";
import { useT } from "@/hooks/useT";
import type { MessageKey } from "@/lib/i18n";

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

/** The email channel: the forwarding address with a copy button, and how to forward to it. */
export function EmailChannel({ address }: { address: string }) {
  const { t } = useT();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success(t("settings.email.copied"));
    } catch {
      toast.error(t("settings.email.copyFailed"));
    }
  };

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4 text-primary" />
          {t("settings.email.title")}
        </CardTitle>
        <CardDescription>{t("settings.email.intro")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 p-4 pt-0 sm:p-6 sm:pt-0">
        {address ? (
          <>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">{t("settings.email.addressLabel")}</p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <code className="min-w-0 flex-1 break-all rounded-md border border-border bg-muted px-3 py-2 font-mono text-sm">
                  {address}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void onCopy()}
                  aria-label={t("settings.email.copyAria")}
                  className="shrink-0"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? t("settings.email.copiedShort") : t("settings.email.copy")}
                </Button>
              </div>
            </div>

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

            <p className="rounded-md bg-muted/60 p-3 text-sm">{t("settings.email.replies")}</p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{t("settings.email.notConfigured")}</p>
        )}
      </CardContent>
    </Card>
  );
}
