"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CircleCheck, Clock, Link2Off, Loader2, MessageSquareHeart } from "lucide-react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Label, Textarea } from "@/components/ui/base";
import { supportError } from "@/components/support/code-step";
import { useT } from "@/hooks/useT";
import type { MessageKey, Translate } from "@/lib/i18n";
import { CSAT_COMMENT_MAX, PublicSupportError, checkCsatToken, submitCsat } from "@/lib/api/public-support";
import { cn } from "@/lib/utils";

/**
 * The CSAT survey from the resolved-ticket email: /support/csat?tenant=<tenant id>&token=<token>,
 * with an optional &score=1..5 when the email's own buttons preselect a score. No sign-in. The page
 * checks the token first (without using it), shows the ticket, and the rating uses the token up.
 * Like every page except the widget, it may be framed only by this app (next.config.ts).
 */

const SCORES = [1, 2, 3, 4, 5] as const;
const SCORE_LABEL: Record<number, MessageKey> = {
  1: "csat.score1",
  2: "csat.score2",
  3: "csat.score3",
  4: "csat.score4",
  5: "csat.score5",
};

/** Final states a token can be in: unknown or replaced, already answered, expired. */
type Closed = "notFound" | "answered" | "expired";

function closedState(err: unknown): Closed | null {
  if (!(err instanceof PublicSupportError)) return null;
  if (err.status === 404) return "notFound";
  if (err.status === 409) return "answered";
  if (err.status === 410) return "expired";
  return null;
}

function parseScore(v: string | null): number | null {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
}

export default function CsatSurveyPage() {
  return (
    <Suspense fallback={null}>
      <CsatSurvey />
    </Suspense>
  );
}

function StateCard({ icon: Icon, title, body, tone = "muted" }: { icon: React.ElementType; title: string; body: string; tone?: "muted" | "success" }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 p-6 text-center sm:p-8">
        <span
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full",
            tone === "success" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="h-6 w-6" aria-hidden />
        </span>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="max-w-md text-sm text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}

function ClosedCard({ state, t }: { state: Closed; t: Translate }) {
  if (state === "answered") return <StateCard icon={CircleCheck} tone="success" title={t("csat.answeredTitle")} body={t("csat.answeredBody")} />;
  if (state === "expired") return <StateCard icon={Clock} title={t("csat.expiredTitle")} body={t("csat.expiredBody")} />;
  return <StateCard icon={Link2Off} title={t("csat.notFoundTitle")} body={t("csat.notFoundBody")} />;
}

function CsatSurvey() {
  const { t } = useT();
  const params = useSearchParams();
  const tenant = (params.get("tenant") || "").trim();
  const token = (params.get("token") || "").trim();
  const linked = parseScore(params.get("score"));

  const [score, setScore] = useState<number | null>(linked);
  const [comment, setComment] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const complete = !!tenant && !!token;
  const survey = useQuery({
    queryKey: ["csat-check", tenant, token],
    queryFn: () => checkCsatToken(tenant, token),
    enabled: complete,
    retry: false,
    staleTime: Infinity,
  });

  const submit = useMutation({
    mutationFn: () => submitCsat(tenant, token, score!, comment),
    onError: (err) => {
      if (!closedState(err)) setFormError(supportError(err, t));
    },
  });

  if (!complete) return <StateCard icon={Link2Off} title={t("csat.incompleteTitle")} body={t("csat.incompleteBody")} />;

  if (survey.isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> {t("csat.checking")}
        </CardContent>
      </Card>
    );
  }

  const closed = closedState(survey.error) ?? closedState(submit.error);
  if (closed) return <ClosedCard state={closed} t={t} />;

  if (survey.isError || !survey.data) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6 text-center">
          <p role="alert" className="text-sm text-destructive">
            {supportError(survey.error, t)}
          </p>
          <Button type="button" variant="outline" onClick={() => void survey.refetch()}>
            {t("common.retry")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (submit.isSuccess) return <StateCard icon={CircleCheck} tone="success" title={t("csat.thanksTitle")} body={t("csat.thanksBody")} />;

  const ticket = survey.data;
  const tooLong = comment.length > CSAT_COMMENT_MAX;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (score == null) return setFormError(t("csat.pickScore"));
    if (tooLong) return setFormError(t("csat.commentTooLong", { n: CSAT_COMMENT_MAX }));
    submit.mutate();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquareHeart className="h-5 w-5 shrink-0 text-primary" aria-hidden />
          {t("csat.title")}
        </CardTitle>
        <CardDescription>{t("csat.intro")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-5 rounded-lg border border-border bg-muted/40 p-3">
          <p className="font-mono text-xs font-medium text-muted-foreground">{ticket.ticket_number}</p>
          <p className="break-words text-sm font-medium">{ticket.subject}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">{t("csat.question")}</legend>
            <div role="radiogroup" aria-label={t("csat.question")} className="grid grid-cols-5 gap-2">
              {SCORES.map((n) => {
                const selected = score === n;
                return (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={t("csat.scoreAria", { n, label: t(SCORE_LABEL[n]) })}
                    onClick={() => {
                      setScore(n);
                      setFormError(null);
                    }}
                    className={cn(
                      "flex h-14 flex-col items-center justify-center rounded-lg border text-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/50",
                    )}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between gap-2 text-xs text-muted-foreground">
              <span>{t("csat.score1")}</span>
              <span className="text-right">{t("csat.score5")}</span>
            </div>
            {score != null && (
              <p className="text-sm" aria-live="polite">
                {t("csat.yourScore", { n: score, label: t(SCORE_LABEL[score]) })}
              </p>
            )}
          </fieldset>

          <div className="space-y-1">
            <Label htmlFor="csat-comment">{t("csat.commentLabel")}</Label>
            <Textarea
              id="csat-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("csat.commentPlaceholder")}
              rows={4}
              aria-invalid={tooLong}
            />
            <p className={cn("text-right text-xs", tooLong ? "text-destructive" : "text-muted-foreground")}>
              {comment.length} / {CSAT_COMMENT_MAX}
            </p>
          </div>

          {formError && (
            <p role="alert" className="text-sm text-destructive">
              {formError}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={submit.isPending}>
            {submit.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {submit.isPending ? t("csat.sending") : t("csat.submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
