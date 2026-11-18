"use client";

import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/common/field";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@/components/ui/base";
import { useHelpCenterSettings, useUpdateHelpCenterSettings } from "@/hooks/useAdminSettings";
import { useT } from "@/hooks/useT";
import type { MessageKey } from "@/lib/i18n";
import {
  HELP_CENTER_CACHE_MAX,
  HELP_CENTER_LIMIT_MAX,
  HELP_CENTER_LIMIT_MIN,
  type HelpCenterLimits,
  type HelpCenterSettings,
} from "@/types/settings";

type FormValues = Record<"article_cache_seconds" | keyof HelpCenterLimits, string>;

const FIELDS: { key: keyof FormValues; label: MessageKey; min: number; max: number }[] = [
  { key: "article_cache_seconds", label: "settings.helpCenter.cacheSeconds", min: 0, max: HELP_CENTER_CACHE_MAX },
  { key: "read_per_minute", label: "settings.helpCenter.readPerMinute", min: HELP_CENTER_LIMIT_MIN, max: HELP_CENTER_LIMIT_MAX },
  { key: "suggest_per_minute", label: "settings.helpCenter.suggestPerMinute", min: HELP_CENTER_LIMIT_MIN, max: HELP_CENTER_LIMIT_MAX },
  { key: "view_per_minute", label: "settings.helpCenter.viewPerMinute", min: HELP_CENTER_LIMIT_MIN, max: HELP_CENTER_LIMIT_MAX },
  { key: "vote_per_hour", label: "settings.helpCenter.votePerHour", min: HELP_CENTER_LIMIT_MIN, max: HELP_CENTER_LIMIT_MAX },
];

function toForm(s: HelpCenterSettings): FormValues {
  return {
    article_cache_seconds: String(s.article_cache_seconds),
    read_per_minute: String(s.limits.read_per_minute),
    suggest_per_minute: String(s.limits.suggest_per_minute),
    view_per_minute: String(s.limits.view_per_minute),
    vote_per_hour: String(s.limits.vote_per_hour),
  };
}

function fromForm(v: FormValues): HelpCenterSettings {
  return {
    article_cache_seconds: Number(v.article_cache_seconds),
    limits: {
      read_per_minute: Number(v.read_per_minute),
      suggest_per_minute: Number(v.suggest_per_minute),
      view_per_minute: Number(v.view_per_minute),
      vote_per_hour: Number(v.vote_per_hour),
    },
  };
}

function inRange(raw: string, min: number, max: number): boolean {
  const n = Number(raw);
  return raw.trim() !== "" && Number.isInteger(n) && n >= min && n <= max;
}

/**
 * Platform settings of every tenant's public help center: the knowledge base limits per visitor and
 * how long the article page is kept on this app's server. Shown to the platform owner only; the
 * API refuses everyone else.
 */
export function HelpCenterSettingsCard({ orgSlug }: { orgSlug: string }) {
  const { t } = useT();
  const { data, isLoading, isError, refetch } = useHelpCenterSettings(orgSlug);
  const update = useUpdateHelpCenterSettings(orgSlug);
  const [values, setValues] = useState<FormValues | null>(null);

  useEffect(() => {
    if (data) setValues(toForm(data));
  }, [data]);

  const valid = !!values && FIELDS.every((f) => inRange(values[f.key], f.min, f.max));
  const changed = !!values && !!data && FIELDS.some((f) => values[f.key] !== toForm(data)[f.key]);

  const onSubmit = async () => {
    if (!values || !valid) return;
    try {
      await update.mutateAsync(fromForm(values));
      toast.success(t("settings.helpCenter.saved"));
    } catch {
      toast.error(t("settings.helpCenter.saveFailed"));
    }
  };

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="h-4 w-4 text-primary" />
          {t("settings.helpCenter.title")}
        </CardTitle>
        <CardDescription>{t("settings.helpCenter.intro")}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        {isLoading || (!values && !isError) ? (
          <div className="h-40 animate-pulse rounded-lg bg-muted" aria-busy="true" />
        ) : isError || !values ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-muted-foreground">{t("settings.helpCenter.loadFailed")}</p>
            <Button variant="outline" onClick={() => void refetch()}>
              {t("common.retry")}
            </Button>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void onSubmit();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <Field
                  key={f.key}
                  label={t(f.label)}
                  htmlFor={`help-center-${f.key}`}
                  error={inRange(values[f.key], f.min, f.max) ? undefined : t("settings.helpCenter.range", { min: f.min, max: f.max })}
                >
                  <Input
                    id={`help-center-${f.key}`}
                    type="number"
                    inputMode="numeric"
                    min={f.min}
                    max={f.max}
                    step={1}
                    value={values[f.key]}
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                    disabled={update.isPending}
                  />
                </Field>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{t("settings.helpCenter.applies")}</p>
            <Button type="submit" disabled={!valid || !changed || update.isPending}>
              {t("common.save")}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
