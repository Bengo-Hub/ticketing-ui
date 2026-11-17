"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchTenantBySlug, type TenantBrand } from "@/lib/api/tenant";
import {
  PublicSupportError,
  addPublicReply,
  getPublicTicket,
  requestTicketAccess,
  sendSupportCode,
  verifySupportCode,
  type PublicTicketView,
} from "@/lib/api/public-support";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@/components/ui/base";
import { toPlainText } from "@/components/common/rich-text";
import { CodeStep, supportError } from "@/components/support/code-step";
import { PublicTicketCard } from "@/components/support/public-ticket-card";
import { useT } from "@/hooks/useT";
import { Loader2 } from "lucide-react";

/**
 * A customer's view of one ticket. The customer gives the ticket number and their email (a link
 * can carry ?org=&ticket=) and confirms the email with a six-digit code. ticketing-api trades the
 * code's one-use token for a ticket access token, issued only when that email is the ticket's
 * requester and valid for about 30 minutes. The page reads the ticket and posts replies with it,
 * so one code covers the visit; when it expires the customer confirms the email again.
 */

const RESEND_SECONDS = 45;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = "find" | "code" | "ticket";

function isExpired(err: unknown): boolean {
  return err instanceof PublicSupportError && err.status === 401;
}

export default function TrackTicketPage() {
  return (
    <Suspense fallback={null}>
      <TrackTicket />
    </Suspense>
  );
}

function TrackTicket() {
  const { t } = useT();
  const params = useSearchParams();
  const linkedSlug = (params.get("org") || params.get("tenant") || "").trim().toLowerCase();
  const linkedTicket = (params.get("ticket") || "").trim();

  const linked = useQuery({
    queryKey: ["support-tenant", linkedSlug],
    queryFn: () => fetchTenantBySlug(linkedSlug),
    enabled: !!linkedSlug,
    staleTime: 5 * 60 * 1000,
  });
  const linkedTenant = linkedSlug ? linked.data ?? null : null;

  const [step, setStep] = useState<Step>("find");
  const [org, setOrg] = useState(linkedSlug);
  const [ticketNumber, setTicketNumber] = useState(linkedTicket);
  const [email, setEmail] = useState("");
  const [tenant, setTenant] = useState<TenantBrand | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // The ticket access token and the view it was issued with.
  const [access, setAccess] = useState<string | null>(null);
  const [initial, setInitial] = useState<PublicTicketView | null>(null);

  const [reply, setReply] = useState("");
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replySent, setReplySent] = useState(false);
  const replyEmpty = toPlainText(reply) === "";

  // A new link slug replaces the organisation field, adjusted during render (no effect).
  const [seenSlug, setSeenSlug] = useState(linkedSlug);
  if (linkedSlug !== seenSlug) {
    setSeenSlug(linkedSlug);
    if (linkedSlug) setOrg(linkedSlug);
  }

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const ticket = useQuery({
    queryKey: ["public-ticket", tenant?.slug, ticketNumber, access],
    queryFn: () => getPublicTicket(tenant!.slug, ticketNumber, access!),
    enabled: step === "ticket" && !!tenant && !!access,
    initialData: initial ?? undefined,
    retry: false,
  });

  async function run(fn: () => Promise<void>, onError: (msg: string) => void = setError) {
    setBusy(true);
    onError("");
    try {
      await fn();
    } catch (err) {
      onError(supportError(err, t));
    } finally {
      setBusy(false);
    }
  }

  // An expired or refused access token sends the customer back to confirm the email again,
  // keeping any reply they were writing.
  async function reverify(reason: string) {
    setAccess(null);
    setInitial(null);
    setCode("");
    setNotice(reason);
    setStep("code");
    if (tenant && cooldown <= 0) {
      try {
        await sendSupportCode(tenant.slug, email);
        setCooldown(RESEND_SECONDS);
      } catch (err) {
        setError(supportError(err, t, t("support.newCodeFailed")));
      }
    }
  }

  // This effect answers an external event (the access token expired) by sending a new code, and
  // the step change it makes ends the condition, so it runs once. reverify only reads state that
  // is already current when the query fails.
  useEffect(() => {
    if (step === "ticket" && ticket.isError && isExpired(ticket.error)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void reverify(t("support.accessEnded"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, ticket.isError, ticket.error]);

  function onFind(e: React.FormEvent) {
    e.preventDefault();
    const slug = org.trim().toLowerCase();
    const number = ticketNumber.trim().toUpperCase();
    const addr = email.trim();
    if (!slug) return setError(t("support.orgRequired"));
    if (!number) return setError(t("support.ticketRequired"));
    if (!EMAIL_RE.test(addr)) return setError(t("support.emailForTicket"));
    void run(async () => {
      const found = linkedTenant && linkedTenant.slug === slug ? linkedTenant : await fetchTenantBySlug(slug);
      if (!found) throw new Error(t("support.orgNotFound"));
      await sendSupportCode(found.slug, addr);
      setTenant(found);
      setTicketNumber(number);
      setEmail(addr);
      setCode("");
      setNotice(null);
      setCooldown(RESEND_SECONDS);
      setStep("code");
    });
  }

  function resend() {
    if (!tenant) return;
    void run(async () => {
      await sendSupportCode(tenant.slug, email);
      setCooldown(RESEND_SECONDS);
    });
  }

  function onCode(e: React.FormEvent) {
    e.preventDefault();
    if (!tenant) return;
    if (!/^\d{6}$/.test(code)) return setError(t("support.codeInvalid"));
    void run(async () => {
      const otpToken = await verifySupportCode(email, code);
      try {
        const granted = await requestTicketAccess(tenant.slug, ticketNumber, otpToken);
        setInitial(granted.ticket);
        setAccess(granted.access_token);
      } catch (err) {
        if (err instanceof PublicSupportError && err.status === 404) {
          setStep("find");
          throw new Error(t("support.ticketNotFound", { number: ticketNumber, email }));
        }
        throw err;
      }
      setNotice(null);
      setStep("ticket");
    });
  }

  function onReply(e: React.FormEvent) {
    e.preventDefault();
    setReplySent(false);
    if (!tenant || !access) return;
    if (replyEmpty) return setReplyError(t("support.replyEmpty"));
    void run(
      async () => {
        try {
          await addPublicReply(tenant.slug, ticketNumber, access, reply);
        } catch (err) {
          if (isExpired(err)) {
            await reverify(t("support.accessEndedReply"));
            return;
          }
          throw err;
        }
        setReply("");
        setReplySent(true);
        void ticket.refetch();
      },
      (m) => setReplyError(m || null),
    );
  }

  const orgName = (tenant ?? linkedTenant)?.orgName || (tenant ?? linkedTenant)?.name;

  if (step === "ticket" && tenant) {
    return (
      <PublicTicketCard
        orgName={orgName}
        ticketNumber={ticketNumber}
        view={ticket.data}
        loading={ticket.isLoading}
        loadError={ticket.isError && !isExpired(ticket.error) ? ticket.error : null}
        email={email}
        reply={reply}
        onReplyChange={(html) => {
          setReply(html);
          setReplySent(false);
        }}
        replyEmpty={replyEmpty}
        replyError={replyError}
        replySent={replySent}
        busy={busy}
        onSubmit={onReply}
      />
    );
  }

  if (step === "code") {
    return (
      <CodeStep
        email={email}
        notice={notice}
        code={code}
        onCodeChange={setCode}
        error={error}
        busy={busy}
        cooldown={cooldown}
        submitLabel={t("support.verifyView")}
        onSubmit={onCode}
        onResend={resend}
        onChangeDetails={() => {
          setError(null);
          setNotice(null);
          setStep("find");
        }}
      />
    );
  }

  const showOrgField = !linkedSlug || (!linked.isLoading && !linkedTenant);
  const newRequestHref = linkedSlug ? `/support?org=${encodeURIComponent(linkedSlug)}` : "/support";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{orgName ? t("support.trackTitleOrg", { org: orgName }) : t("support.trackTitle")}</CardTitle>
        <CardDescription>{t("support.trackIntro")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onFind} className="space-y-4" noValidate>
          {linkedSlug && linked.isLoading && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> {t("support.loadingOrg")}
            </p>
          )}
          {showOrgField && (
            <div className="space-y-1">
              <Label htmlFor="org">{t("support.orgLabel")}</Label>
              <Input
                id="org"
                value={org}
                onChange={(e) => setOrg(e.target.value)}
                placeholder={t("support.orgPlaceholder")}
                autoCapitalize="none"
              />
              {linkedSlug && !linkedTenant && <p className="text-xs text-destructive">{t("support.orgNotInLink")}</p>}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0 space-y-1">
              <Label htmlFor="ticket">{t("support.ticketNumber")}</Label>
              <Input
                id="ticket"
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value)}
                placeholder="TKT-000123"
                autoCapitalize="characters"
                className="font-mono"
              />
            </div>
            <div className="min-w-0 space-y-1">
              <Label htmlFor="email">{t("support.email")}</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("support.emailPlaceholder")}
              />
            </div>
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={busy || (!!linkedSlug && linked.isLoading)}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {busy ? t("support.sendingCode") : t("common.continue")}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {t("support.noTicket")}{" "}
            <Link href={newRequestHref} className="font-medium text-primary hover:underline">
              {t("support.submitRequest")}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
