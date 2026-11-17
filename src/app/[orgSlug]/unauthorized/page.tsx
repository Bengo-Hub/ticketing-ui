"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/base";
import { useT } from "@/hooks/useT";

export default function UnauthorizedPage() {
  const params = useParams();
  const orgSlug = params?.orgSlug as string;
  const { t } = useT();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
        <ShieldX className="h-8 w-8 text-destructive" />
      </div>
      <div className="max-w-md">
        <h1 className="text-2xl font-bold text-foreground">{t("auth.deniedTitle")}</h1>
        <p className="mt-2 text-muted-foreground">{t("auth.deniedBody")}</p>
      </div>
      <Button asChild variant="outline">
        <Link href={orgSlug ? `/${orgSlug}/tickets` : "/"}>{t("auth.deniedBack")}</Link>
      </Button>
    </div>
  );
}
