"use client";

import { useEffect, useState } from "react";
import { Smile } from "lucide-react";
import { toast } from "sonner";
import { Field, SwitchField } from "@/components/common/field";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@/components/ui/base";
import { useCsatSettings, useUpdateCsatSettings } from "@/hooks/useAdminSettings";
import { useT } from "@/hooks/useT";
import { CSAT_LINK_DAYS_MAX, CSAT_LINK_DAYS_MIN } from "@/types/settings";

/**
 * The satisfaction survey sent when a ticket is resolved: the on or off switch, saved as soon as it
 * is flipped, and how many days the survey link works, saved with its own button.
 */
export function CsatSettingsCard({ orgSlug }: { orgSlug: string }) {
  const { t } = useT();
  const { data, isLoading, isError, refetch } = useCsatSettings(orgSlug);
  const update = useUpdateCsatSettings(orgSlug);
  const [days, setDays] = useState("");

  useEffect(() => {
    if (data) setDays(String(data.link_valid_days));
  }, [data]);

  const pendingEnabled = update.isPending ? update.variables?.enabled : undefined;
  const enabled = pendingEnabled ?? !!data?.enabled;
  const parsedDays = Number(days);
  const daysValid = Number.isInteger(parsedDays) && parsedDays >= CSAT_LINK_DAYS_MIN && parsedDays <= CSAT_LINK_DAYS_MAX;
  const daysChanged = !!data && daysValid && parsedDays !== data.link_valid_days;

  const save = async (patch: { enabled?: boolean; link_valid_days?: number }) => {
    try {
      await update.mutateAsync(patch);
      toast.success(t("settings.csat.saved"));
    } catch {
      toast.error(t("settings.csat.saveFailed"));
    }
  };

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-base">
          <Smile className="h-4 w-4 text-primary" />
          {t("settings.csat.title")}
        </CardTitle>
        <CardDescription>{t("settings.csat.intro")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
        {isLoading ? (
          <div className="h-28 animate-pulse rounded-lg bg-muted" aria-busy="true" />
        ) : isError || !data ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-muted-foreground">{t("settings.csat.loadFailed")}</p>
            <Button variant="outline" onClick={() => void refetch()}>
              {t("common.retry")}
            </Button>
          </div>
        ) : (
          <>
            <SwitchField
              label={t("settings.csat.enabled")}
              description={enabled ? t("settings.csat.enabledOn") : t("settings.csat.enabledOff")}
              checked={enabled}
              onChange={(next) => void save({ enabled: next })}
              disabled={update.isPending}
            />
            <form
              className="flex flex-col gap-3 sm:flex-row sm:items-end"
              onSubmit={(e) => {
                e.preventDefault();
                if (daysChanged) void save({ link_valid_days: parsedDays });
              }}
            >
              <Field
                label={t("settings.csat.linkDays")}
                htmlFor="csat-link-days"
                className="sm:max-w-xs"
                hint={t("settings.csat.linkDaysHint", { min: CSAT_LINK_DAYS_MIN, max: CSAT_LINK_DAYS_MAX })}
                error={days !== "" && !daysValid ? t("settings.csat.linkDaysInvalid", { min: CSAT_LINK_DAYS_MIN, max: CSAT_LINK_DAYS_MAX }) : undefined}
              >
                <Input
                  id="csat-link-days"
                  type="number"
                  inputMode="numeric"
                  min={CSAT_LINK_DAYS_MIN}
                  max={CSAT_LINK_DAYS_MAX}
                  step={1}
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  disabled={update.isPending || !enabled}
                />
              </Field>
              <Button type="submit" variant="outline" disabled={!daysChanged || update.isPending || !enabled}>
                {t("common.save")}
              </Button>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  );
}
