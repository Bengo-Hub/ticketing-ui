"use client";

import { ExternalLink, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { SwitchField } from "@/components/common/field";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/base";
import { useAiSettings, useUpdateAiSettings } from "@/hooks/useAI";
import { useT } from "@/hooks/useT";
import { AI_CREDITS_URL } from "@/lib/subscriptions";

/** AI with Vera: the auto-classify switch, off by default and saved as soon as it is flipped. */
export function AiSettingsCard({ orgSlug }: { orgSlug: string }) {
  const { t } = useT();
  const { data, isLoading, isError, refetch } = useAiSettings(orgSlug);
  const update = useUpdateAiSettings(orgSlug);
  // While a save is in flight the switch shows the value being saved.
  const autoClassify = update.isPending && update.variables ? update.variables.auto_classify : !!data?.auto_classify;

  const onChange = async (next: boolean) => {
    try {
      await update.mutateAsync({ auto_classify: next });
      toast.success(t("ai.settings.saved"));
    } catch {
      toast.error(t("ai.settings.saveFailed"));
    }
  };

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          {t("ai.settings.title")}
        </CardTitle>
        <CardDescription>{t("ai.settings.intro")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0 sm:p-6 sm:pt-0">
        {isLoading ? (
          <div className="h-16 animate-pulse rounded-lg bg-muted" aria-busy="true" />
        ) : isError || !data ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-muted-foreground">{t("ai.settings.loadFailed")}</p>
            <Button variant="outline" onClick={() => void refetch()}>
              {t("common.retry")}
            </Button>
          </div>
        ) : (
          <SwitchField
            label={t("ai.settings.autoClassify")}
            description={autoClassify ? t("ai.settings.autoClassifyOn") : t("ai.settings.autoClassifyOff")}
            checked={autoClassify}
            onChange={(next) => void onChange(next)}
            disabled={update.isPending}
          />
        )}
        <p className="text-xs text-muted-foreground">{t("ai.settings.cost")}</p>
        <a
          href={AI_CREDITS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {t("ai.buyCredits")} <ExternalLink className="h-3 w-3" />
        </a>
      </CardContent>
    </Card>
  );
}
