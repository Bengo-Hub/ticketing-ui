"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { fetchTenantBySlug, type TenantBrand } from "@/lib/api/tenant";
import { createPublicTicket, sendSupportCode, verifySupportCode } from "@/lib/api/public-support";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
} from "@/components/ui/base";
import { Loader2, CheckCircle2 } from "lucide-react";

/**
 * Public support form. A ticket belongs to one organisation, so the page needs its slug: from
 * the link (/support?org=<slug>, `tenant` also accepted) or typed by the visitor, and checked
 * against auth-api before any code is sent. The visitor's email is then proved with a six-digit
 * code, and the one-use token from that code opens the ticket in ticketing-api.
 */

const schema = z.object({
  org: z.string().trim().min(1, "Organization is required"),
  name: z.string().trim().min(2, "Name is required").max(120, "Name is too long"),
  email: z.string().trim().email("Valid email is required").max(254),
  subject: z.string().trim().min(5, "Subject must be at least 5 characters").max(200, "Subject is too long"),
  description: z
    .string()
    .trim()
    .min(10, "Please describe your issue in more detail")
    .max(5000, "Please keep the description under 5,000 characters"),
});

type FormData = z.infer<typeof schema>;
type Step = "details" | "code" | "done";

const RESEND_SECONDS = 45;

export default function SupportPage() {
  return (
    <Suspense fallback={null}>
      <SupportForm />
    </Suspense>
  );
}

function SupportForm() {
  const params = useSearchParams();
  const linkedSlug = (params.get("org") || params.get("tenant") || "").trim().toLowerCase();

  // The organisation named in the link, shown by name and not asked for again.
  const linked = useQuery({
    queryKey: ["support-tenant", linkedSlug],
    queryFn: () => fetchTenantBySlug(linkedSlug),
    enabled: !!linkedSlug,
    staleTime: 5 * 60 * 1000,
  });
  const linkedTenant = linkedSlug ? linked.data ?? null : null;

  const [step, setStep] = useState<Step>("details");
  const [tenant, setTenant] = useState<TenantBrand | null>(null);
  const [details, setDetails] = useState<FormData | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { org: linkedSlug },
  });

  useEffect(() => {
    if (linkedSlug) setValue("org", linkedSlug);
  }, [linkedSlug, setValue]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const onDetails = handleSubmit((data) =>
    run(async () => {
      const slug = data.org.trim().toLowerCase();
      const found = linkedTenant && linkedTenant.slug === slug ? linkedTenant : await fetchTenantBySlug(slug);
      if (!found) {
        throw new Error("We could not find that organization. Check the name in the link you were given.");
      }
      await sendSupportCode(found.slug, data.email.trim());
      setTenant(found);
      setDetails({ ...data, org: found.slug, email: data.email.trim() });
      setCode("");
      setCooldown(RESEND_SECONDS);
      setStep("code");
    }),
  );

  function resend() {
    if (!tenant || !details) return;
    void run(async () => {
      await sendSupportCode(tenant.slug, details.email);
      setCooldown(RESEND_SECONDS);
    });
  }

  function onCode(e: React.FormEvent) {
    e.preventDefault();
    if (!tenant || !details) return;
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from the email.");
      return;
    }
    void run(async () => {
      const token = await verifySupportCode(details.email, code);
      const res = await createPublicTicket(tenant.slug, token, {
        name: details.name.trim(),
        subject: details.subject.trim(),
        description: details.description.trim(),
      });
      setTicketNumber(res.ticket_number ?? null);
      setStep("done");
    });
  }

  function startOver() {
    reset({ org: linkedSlug || details?.org || "", name: details?.name, email: details?.email });
    setDetails(null);
    setTicketNumber(null);
    setError(null);
    setStep("details");
  }

  const orgName = (tenant ?? linkedTenant)?.orgName || (tenant ?? linkedTenant)?.name;

  if (step === "done") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
          <div role="status">
            <h2 className="text-xl font-semibold">Ticket submitted</h2>
            {ticketNumber && (
              <p className="mt-1 text-sm text-muted-foreground">
                Ticket number: <span className="font-mono font-medium">{ticketNumber}</span>
              </p>
            )}
            <p className="mt-3 text-sm text-muted-foreground">
              {orgName ? `${orgName} will reply to ` : "Replies go to "}
              <span className="font-medium text-foreground">{details?.email}</span>.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {ticketNumber && tenant && (
              <Button asChild>
                <Link
                  href={`/support/track?org=${encodeURIComponent(tenant.slug)}&ticket=${encodeURIComponent(ticketNumber)}`}
                >
                  Track this ticket
                </Link>
              </Button>
            )}
            <Button variant="outline" onClick={startOver}>
              Submit another request
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "code" && details) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We sent a 6-digit code to <span className="font-medium text-foreground">{details.email}</span>. It
            expires in 10 minutes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCode} className="space-y-4">
            <div className="max-w-xs space-y-1">
              <Label htmlFor="otp">Verification code</Label>
              <Input
                id="otp"
                required
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
                Verify and submit
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
                  setStep("details");
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{linkedTenant ? `Contact ${linkedTenant.orgName || linkedTenant.name}` : "Submit a support request"}</CardTitle>
        <CardDescription>
          Fill in the form below and the team will get back to you by email. We send a short code to your email
          first to confirm the address is yours.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onDetails} className="space-y-4" noValidate>
          {linkedSlug && linked.isLoading && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading organization...
            </p>
          )}

          {showOrgField && (
            <div className="space-y-1">
              <Label htmlFor="org">Organization</Label>
              <Input id="org" {...register("org")} placeholder="your-company" autoCapitalize="none" />
              <p className="text-xs text-muted-foreground">
                The organization&apos;s short name, as it appears in its Codevertex links.
              </p>
              {linkedSlug && !linkedTenant && (
                <p className="text-xs text-destructive">The organization in this link was not found.</p>
              )}
              {errors.org && <p className="text-xs text-destructive">{errors.org.message}</p>}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="name">Your name</Label>
              <Input id="name" autoComplete="name" {...register("name")} placeholder="Jane Doe" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...register("email")}
                placeholder="jane@example.com"
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" maxLength={200} {...register("subject")} placeholder="Brief description of your issue" />
            {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              maxLength={5000}
              {...register("description")}
              placeholder="Describe your issue in detail..."
              rows={5}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
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
            Already have a ticket?{" "}
            <Link
              href={linkedSlug ? `/support/track?org=${encodeURIComponent(linkedSlug)}` : "/support/track"}
              className="font-medium text-primary hover:underline"
            >
              Track it here
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
