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
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Separator,
  Textarea,
} from "@/components/ui/base";
import { CheckCircle2, Loader2 } from "lucide-react";

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

function statusVariant(status: string): "default" | "secondary" | "success" | "warning" | "outline" {
  switch (status) {
    case "resolved":
    case "closed":
      return "success";
    case "in_progress":
      return "default";
    case "pending_customer":
      return "warning";
    case "cancelled":
      return "secondary";
    default:
      return "outline";
  }
}

function statusLabel(status: string): string {
  if (status === "pending_customer") return "Waiting for your reply";
  if (status === "pending_internal") return "In progress";
  const s = status.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function when(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function message(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

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

  useEffect(() => {
    if (linkedSlug) setOrg(linkedSlug);
  }, [linkedSlug]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
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
      onError(message(err, "Something went wrong. Please try again."));
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
        setError(message(err, "We could not send a new code. Please try again."));
      }
    }
  }

  useEffect(() => {
    if (step === "ticket" && ticket.isError && isExpired(ticket.error)) {
      void reverify("Your access to this ticket has ended. We sent a new code to confirm it is still you.");
    }
    // reverify only reads state that is already current when the query fails.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, ticket.isError, ticket.error]);

  function onFind(e: React.FormEvent) {
    e.preventDefault();
    const slug = org.trim().toLowerCase();
    const number = ticketNumber.trim().toUpperCase();
    const addr = email.trim();
    if (!slug) return setError("Enter the organization.");
    if (!number) return setError("Enter your ticket number.");
    if (!EMAIL_RE.test(addr)) return setError("Enter the email address you used for the ticket.");
    void run(async () => {
      const found = linkedTenant && linkedTenant.slug === slug ? linkedTenant : await fetchTenantBySlug(slug);
      if (!found) {
        throw new Error("We could not find that organization. Check the name in the link you were given.");
      }
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
    if (!/^\d{6}$/.test(code)) return setError("Enter the 6-digit code from the email.");
    void run(async () => {
      const otpToken = await verifySupportCode(email, code);
      try {
        const granted = await requestTicketAccess(tenant.slug, ticketNumber, otpToken);
        setInitial(granted.ticket);
        setAccess(granted.access_token);
      } catch (err) {
        if (err instanceof PublicSupportError && err.status === 404) {
          setStep("find");
          throw new Error(
            `We could not find ticket ${ticketNumber} for ${email}. Check the number and use the email that opened the ticket.`,
          );
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
    if (!reply.trim()) return setReplyError("Write your reply first.");
    void run(
      async () => {
        try {
          await addPublicReply(tenant.slug, ticketNumber, access, reply.trim());
        } catch (err) {
          if (isExpired(err)) {
            await reverify("Your access to this ticket has ended. Confirm your email again and your reply will still be here.");
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
    const t = ticket.data;
    return (
      <Card>
        <CardHeader>
          <CardDescription>{orgName ? `${orgName} support` : "Support"}</CardDescription>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <span className="font-mono">{ticketNumber}</span>
            {t && <Badge variant={statusVariant(t.status)}>{statusLabel(t.status)}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {ticket.isLoading && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading ticket...
            </p>
          )}
          {ticket.isError && !isExpired(ticket.error) && (
            <p role="alert" className="text-sm text-destructive">
              {message(ticket.error, "We could not load this ticket. Please try again.")}
            </p>
          )}
          {t && (
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
              <div className="sm:col-span-3">
                <dt className="text-muted-foreground">Subject</dt>
                <dd className="font-medium">{t.subject}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Opened</dt>
                <dd>{when(t.created_at)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Last update</dt>
                <dd>{when(t.updated_at)}</dd>
              </div>
            </dl>
          )}

          <Separator />

          <form onSubmit={onReply} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="reply">Add a reply</Label>
              <Textarea
                id="reply"
                rows={4}
                maxLength={5000}
                value={reply}
                onChange={(e) => {
                  setReply(e.target.value);
                  setReplySent(false);
                }}
                placeholder="Anything the team should know..."
              />
              <p className="text-xs text-muted-foreground">
                The team answers by email at <span className="font-medium text-foreground">{email}</span>.
              </p>
            </div>
            {replyError && (
              <p role="alert" className="text-sm text-destructive">
                {replyError}
              </p>
            )}
            {replySent && (
              <p role="status" className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" /> Your reply was added to the ticket.
              </p>
            )}
            <Button type="submit" disabled={busy || !reply.trim()}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send reply
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (step === "code") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            {notice ? `${notice} ` : ""}
            We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>. It expires in 10
            minutes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCode} className="space-y-4">
            <div className="max-w-xs space-y-1">
              <Label htmlFor="otp">Verification code</Label>
              <Input
                id="otp"
                autoFocus
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
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
                Verify and view ticket
              </Button>
              <Button type="button" variant="ghost" disabled={busy || cooldown > 0} onClick={resend}>
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={() => {
                  setError(null);
                  setNotice(null);
                  setStep("find");
                }}
              >
                Change details
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  const showOrgField = !linkedSlug || (!linked.isLoading && !linkedTenant);
  const newRequestHref = linkedSlug ? `/support?org=${encodeURIComponent(linkedSlug)}` : "/support";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{orgName ? `Track a ticket with ${orgName}` : "Track a ticket"}</CardTitle>
        <CardDescription>
          Enter your ticket number and the email you used. We send a short code to that email before showing the
          ticket.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onFind} className="space-y-4" noValidate>
          {linkedSlug && linked.isLoading && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading organization...
            </p>
          )}
          {showOrgField && (
            <div className="space-y-1">
              <Label htmlFor="org">Organization</Label>
              <Input
                id="org"
                value={org}
                onChange={(e) => setOrg(e.target.value)}
                placeholder="your-company"
                autoCapitalize="none"
              />
              {linkedSlug && !linkedTenant && (
                <p className="text-xs text-destructive">The organization in this link was not found.</p>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="ticket">Ticket number</Label>
              <Input
                id="ticket"
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value)}
                placeholder="TKT-000123"
                autoCapitalize="characters"
                className="font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
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
            {busy ? "Sending code..." : "Continue"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            No ticket yet?{" "}
            <Link href={newRequestHref} className="font-medium text-primary hover:underline">
              Submit a support request
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
