"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { RichTextEditor } from "@bengo-hub/shared-ui-lib/rich-text-editor";
import { fetchTenantBySlug, type TenantBrand } from "@/lib/api/tenant";
import { createPublicTicket, sendSupportCode, verifySupportCode } from "@/lib/api/public-support";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@/components/ui/base";
import { toPlainText } from "@/components/common/rich-text";
import { CodeStep, supportError } from "@/components/support/code-step";
import { useT } from "@/hooks/useT";
import type { Translate } from "@/lib/i18n";
import { Loader2, CheckCircle2 } from "lucide-react";

/**
 * Public support form. A ticket belongs to one organisation, so the page needs its slug: from
 * the link (/support?org=<slug>, `tenant` also accepted) or typed by the visitor, and checked
 * against auth-api before any code is sent. The visitor's email is then proved with a six-digit
 * code, and the one-use token from that code opens the ticket in ticketing-api.
 *
 * The description is written in the shared RichTextEditor and stored as HTML, like tickets raised
 * from the signed-in app. ticketing-api caps the stored value at 5,000 characters.
 */

const DESCRIPTION_MAX = 5000;

function buildSchema(t: Translate) {
  return z.object({
    org: z.string().trim().min(1, t("support.orgRequired")),
    name: z.string().trim().min(2, t("support.nameRequired")).max(120, t("support.nameTooLong")),
    email: z.string().trim().email(t("support.emailInvalid")).max(254, t("support.emailInvalid")),
    subject: z.string().trim().min(5, t("support.subjectShort")).max(200, t("support.subjectLong")),
    description: z
      .string()
      .refine((v) => toPlainText(v).length >= 10, t("support.descriptionShort"))
      .refine((v) => v.length <= DESCRIPTION_MAX, t("support.descriptionLong")),
  });
}

type FormData = z.infer<ReturnType<typeof buildSchema>>;
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
  const { t } = useT();
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

  const schema = useMemo(() => buildSchema(t), [t]);
  const { register, control, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { org: linkedSlug, name: "", email: "", subject: "", description: "" },
  });

  useEffect(() => {
    if (linkedSlug) setValue("org", linkedSlug);
  }, [linkedSlug, setValue]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(supportError(err, t));
    } finally {
      setBusy(false);
    }
  }

  const onDetails = handleSubmit((data) =>
    run(async () => {
      const slug = data.org.trim().toLowerCase();
      const found = linkedTenant && linkedTenant.slug === slug ? linkedTenant : await fetchTenantBySlug(slug);
      if (!found) throw new Error(t("support.orgNotFound"));
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
      setError(t("support.codeInvalid"));
      return;
    }
    void run(async () => {
      const token = await verifySupportCode(details.email, code);
      const res = await createPublicTicket(tenant.slug, token, {
        name: details.name.trim(),
        subject: details.subject.trim(),
        description: details.description,
      });
      setTicketNumber(res.ticket_number ?? null);
      setStep("done");
    });
  }

  function startOver() {
    reset({ org: linkedSlug || details?.org || "", name: details?.name ?? "", email: details?.email ?? "", subject: "", description: "" });
    setDetails(null);
    setTicketNumber(null);
    setError(null);
    setStep("details");
  }

  const orgName = (tenant ?? linkedTenant)?.orgName || (tenant ?? linkedTenant)?.name;

  if (step === "done") {
    const email = details?.email ?? "";
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
          <div role="status" className="min-w-0">
            <h2 className="text-xl font-semibold">{t("support.submitted")}</h2>
            {ticketNumber && (
              <p className="mt-1 text-sm text-muted-foreground">
                {t("support.ticketNumberIs")} <span className="font-mono font-medium">{ticketNumber}</span>
              </p>
            )}
            <p className="mt-3 text-sm text-muted-foreground wrap-break-word">
              {orgName ? t("support.orgWillReply", { org: orgName, email }) : t("support.repliesGoTo", { email })}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {ticketNumber && tenant && (
              <Button asChild>
                <Link
                  href={`/support/track?org=${encodeURIComponent(tenant.slug)}&ticket=${encodeURIComponent(ticketNumber)}`}
                >
                  {t("support.trackThis")}
                </Link>
              </Button>
            )}
            <Button variant="outline" onClick={startOver}>
              {t("support.submitAnother")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "code" && details) {
    return (
      <CodeStep
        email={details.email}
        code={code}
        onCodeChange={setCode}
        error={error}
        busy={busy}
        cooldown={cooldown}
        submitLabel={t("support.verifySubmit")}
        onSubmit={onCode}
        onResend={resend}
        onChangeDetails={() => {
          setError(null);
          setStep("details");
        }}
      />
    );
  }

  const showOrgField = !linkedSlug || (!linked.isLoading && !linkedTenant);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {linkedTenant
            ? t("support.newTitleOrg", { org: linkedTenant.orgName || linkedTenant.name })
            : t("support.newTitle")}
        </CardTitle>
        <CardDescription>{t("support.newIntro")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onDetails} className="space-y-4" noValidate>
          {linkedSlug && linked.isLoading && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> {t("support.loadingOrg")}
            </p>
          )}

          {showOrgField && (
            <div className="space-y-1">
              <Label htmlFor="org">{t("support.orgLabel")}</Label>
              <Input id="org" {...register("org")} placeholder={t("support.orgPlaceholder")} autoCapitalize="none" />
              <p className="text-xs text-muted-foreground">{t("support.orgHint")}</p>
              {linkedSlug && !linkedTenant && <p className="text-xs text-destructive">{t("support.orgNotInLink")}</p>}
              {errors.org && <p className="text-xs text-destructive">{errors.org.message}</p>}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0 space-y-1">
              <Label htmlFor="name">{t("support.name")}</Label>
              <Input id="name" autoComplete="name" {...register("name")} placeholder={t("support.namePlaceholder")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="min-w-0 space-y-1">
              <Label htmlFor="email">{t("support.email")}</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                {...register("email")}
                placeholder={t("support.emailPlaceholder")}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="subject">{t("support.subject")}</Label>
            <Input id="subject" maxLength={200} {...register("subject")} placeholder={t("support.subjectPlaceholder")} />
            {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
          </div>

          <div className="min-w-0 space-y-1">
            <Label id="description-label">{t("support.description")}</Label>
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t("support.descriptionPlaceholder")}
                  ariaLabelledBy="description-label"
                  ariaDescribedBy={errors.description ? "description-error" : undefined}
                  disabled={busy}
                />
              )}
            />
            {errors.description && (
              <p id="description-error" className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
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
            {t("support.haveTicket")}{" "}
            <Link
              href={linkedSlug ? `/support/track?org=${encodeURIComponent(linkedSlug)}` : "/support/track"}
              className="font-medium text-primary hover:underline"
            >
              {t("support.trackIt")}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
