"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, LifeBuoy } from "lucide-react";
import { fetchTenantBySlug } from "@/lib/api/tenant";
import { helpCenterHref } from "@/lib/api/public-kb";
import { HelpCenterList } from "@/components/kb/help-center-list";
import { useT } from "@/hooks/useT";

/**
 * The public help center: /support/kb?org=<slug> (`tenant` also accepted, as on the track page).
 * The tenant's published, public articles with search and categories, no sign-in.
 */
export default function HelpCenterPage() {
  return (
    <Suspense fallback={null}>
      <HelpCenter />
    </Suspense>
  );
}

function HelpCenter() {
  const { t } = useT();
  const params = useSearchParams();
  const slug = (params.get("org") || params.get("tenant") || "").trim().toLowerCase();

  const tenant = useQuery({
    queryKey: ["support-tenant", slug],
    queryFn: () => fetchTenantBySlug(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
  const orgName = tenant.data?.orgName || tenant.data?.name;

  if (!slug || (!tenant.isLoading && !tenant.data)) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card py-12 text-center">
        <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="px-4 text-sm text-muted-foreground">{slug ? t("support.orgNotInLink") : t("helpCenter.orgMissing")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground wrap-break-word">
          {orgName ? t("helpCenter.titleOrg", { org: orgName }) : t("helpCenter.title")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("helpCenter.intro")}</p>
      </div>

      <HelpCenterList tenantSlug={slug} articleHref={(a) => helpCenterHref(slug, a)} />

      <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <LifeBuoy className="h-4 w-4" />
        {t("helpCenter.stillNeedHelp")}
        <Link href={`/support?org=${encodeURIComponent(slug)}`} className="font-medium text-primary hover:underline">
          {t("helpCenter.contactUs")}
        </Link>
      </p>
    </div>
  );
}
