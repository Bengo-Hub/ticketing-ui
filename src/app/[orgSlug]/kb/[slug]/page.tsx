"use client";

import { useParams } from "next/navigation";
import { HelpArticle } from "@/components/kb/help-article";
import { orgRoute } from "@/lib/utils";

/** A published, public article inside the signed-in app, the same view as the public help center. */
export default function KBArticlePage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const slug = decodeURIComponent(params.slug as string);

  return (
    <div className="mx-auto max-w-3xl">
      <HelpArticle
        tenantSlug={orgSlug}
        slug={slug}
        backHref={orgRoute(orgSlug, "/kb")}
        contactHref={orgRoute(orgSlug, "/tickets/new")}
      />
    </div>
  );
}
