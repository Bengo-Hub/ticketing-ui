"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/base";

export default function UnauthorizedPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;

  return (
    <div className="flex min-h-[60vh] items-center justify-center flex-col gap-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <ShieldAlert className="h-8 w-8 text-destructive" />
      </div>
      <div>
        <h1 className="text-2xl font-black text-foreground">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">
          You don&apos;t have permission to access this page.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href={`/${orgSlug}/tickets`}>Go to Tickets</Link>
      </Button>
    </div>
  );
}
