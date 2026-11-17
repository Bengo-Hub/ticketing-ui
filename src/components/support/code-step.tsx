"use client";

import { Loader2 } from "lucide-react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@/components/ui/base";
import { useT } from "@/hooks/useT";
import { PublicSupportError } from "@/lib/api/public-support";
import type { Translate } from "@/lib/i18n";

/**
 * The public pages' error wording. A refused network call, a rate limit and a server fault get the
 * page's own words in the active language; any other refusal shows the API's message.
 */
export function supportError(err: unknown, t: Translate, fallback?: string): string {
  if (err instanceof PublicSupportError) {
    if (err.status === 0) return t("support.errorNetwork");
    if (err.status === 429) return t("support.errorBusy");
    if (err.status >= 500) return t("support.errorServer");
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback ?? t("common.somethingWrong");
}

/** The six-digit email code step shared by the request and tracking pages. */
export function CodeStep({
  email,
  notice,
  code,
  onCodeChange,
  error,
  busy,
  cooldown,
  submitLabel,
  onSubmit,
  onResend,
  onChangeDetails,
  compact = false,
}: {
  email: string;
  notice?: string | null;
  code: string;
  onCodeChange: (code: string) => void;
  error: string | null;
  busy: boolean;
  cooldown: number;
  submitLabel: string;
  onSubmit: (e: React.FormEvent) => void;
  onResend: () => void;
  onChangeDetails: () => void;
  /** The widget's layout: no card frame and no side padding. */
  compact?: boolean;
}) {
  const { t } = useT();
  const [before, after] = t("support.codeSent", { email: "\u0000" }).split("\u0000");
  return (
    <Card className={compact ? "border-0 bg-transparent shadow-none" : undefined}>
      <CardHeader className={compact ? "px-0 pt-0" : undefined}>
        <CardTitle className={compact ? "text-lg" : undefined}>{t("support.checkEmail")}</CardTitle>
        <CardDescription className="wrap-break-word">
          {notice ? `${notice} ` : ""}
          {before}
          <span className="font-medium text-foreground">{email}</span>
          {after}
        </CardDescription>
      </CardHeader>
      <CardContent className={compact ? "px-0 pb-0" : undefined}>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="max-w-xs space-y-1">
            <Label htmlFor="otp">{t("support.codeLabel")}</Label>
            <Input
              id="otp"
              required
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => onCodeChange(e.target.value.replace(/\D/g, ""))}
              className="text-center font-mono text-lg tracking-[0.4em]"
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={busy || code.length !== 6}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitLabel}
            </Button>
            <Button type="button" variant="ghost" disabled={busy || cooldown > 0} onClick={onResend}>
              {cooldown > 0 ? t("support.resendIn", { n: cooldown }) : t("support.resend")}
            </Button>
            <Button type="button" variant="ghost" disabled={busy} onClick={onChangeDetails}>
              {t("support.changeDetails")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
