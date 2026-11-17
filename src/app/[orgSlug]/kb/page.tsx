"use client";

import { useParams, useRouter } from "next/navigation";
import { BookOpen, PlusCircle } from "lucide-react";
import { useServicePermissions } from "@/hooks/useServicePermissions";
import { PERM } from "@/lib/rbac/permissions";
import { PageHeader } from "@/components/common/page-header";
import { HelpCenterList } from "@/components/kb/help-center-list";
import { Button } from "@/components/ui/base";
import { orgRoute } from "@/lib/utils";

/**
 * The knowledge base as customers see it, inside the signed-in app: the same published, public
 * articles as the public help center. Staff manage every article under /admin/kb.
 */
export default function KBPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;
  const { can } = useServicePermissions(orgSlug);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader
        icon={BookOpen}
        title="Knowledge base"
        actions={
          can(PERM.kbManage) ? (
            <Button onClick={() => router.push(orgRoute(orgSlug, "/admin/kb/new"))}>
              <PlusCircle className="h-4 w-4" /> New article
            </Button>
          ) : undefined
        }
      />
      <HelpCenterList tenantSlug={orgSlug} articleHref={(slug) => orgRoute(orgSlug, `/kb/${slug}`)} />
    </div>
  );
}
