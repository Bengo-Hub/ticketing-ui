"use client";

import { useSyncExternalStore } from "react";
import { ExternalLink, LifeBuoy } from "lucide-react";
import { CopyButton } from "@/components/common/copy-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/base";
import { useT } from "@/hooks/useT";

/** Where the widget is served from when the page is rendered on the server. */
const DEFAULT_ORIGIN = "https://ticketing.codevertexafrica.com";

const subscribeNoop = () => () => {};
const clientOrigin = () => window.location.origin;
const serverOrigin = () => DEFAULT_ORIGIN;

/**
 * The embeddable web widget: a script tag a tenant pastes into their own site. It adds a help
 * button that opens the public request form, with its email code, in a panel.
 */
export function WidgetChannel({ orgSlug }: { orgSlug: string }) {
  const { t } = useT();
  const origin = useSyncExternalStore(subscribeNoop, clientOrigin, serverOrigin);
  const snippet = `<script src="${origin}/widget.js" data-tenant="${orgSlug}" async></script>`;
  const preview = `${origin}/support/widget?tenant=${encodeURIComponent(orgSlug)}`;

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-base">
          <LifeBuoy className="h-4 w-4 text-primary" />
          {t("settings.widget.title")}
        </CardTitle>
        <CardDescription>{t("settings.widget.intro")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
        <div className="space-y-1.5">
          <p className="text-sm font-medium">{t("settings.widget.snippetLabel")}</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <pre className="min-w-0 flex-1 overflow-x-auto whitespace-pre-wrap break-all rounded-md border border-border bg-muted px-3 py-2 font-mono text-xs">
              <code>{snippet}</code>
            </pre>
            <CopyButton text={snippet} ariaLabel={t("settings.widget.copyAria")} copiedToast={t("settings.widget.copied")} />
          </div>
        </div>

        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>{t("settings.widget.step1")}</li>
          <li>{t("settings.widget.step2")}</li>
          <li>{t("settings.widget.step3")}</li>
        </ol>

        <div className="space-y-1 rounded-md bg-muted/60 p-3 text-sm">
          <p className="font-medium">{t("settings.widget.optionsTitle")}</p>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li className="break-words">{t("settings.widget.optionTheme")}</li>
            <li className="break-words">{t("settings.widget.optionPosition")}</li>
            <li className="break-words">{t("settings.widget.optionLabel")}</li>
            <li className="break-words">{t("settings.widget.optionColor")}</li>
          </ul>
        </div>

        <a
          href={preview}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ExternalLink className="h-4 w-4" />
          {t("settings.widget.preview")}
        </a>
      </CardContent>
    </Card>
  );
}
