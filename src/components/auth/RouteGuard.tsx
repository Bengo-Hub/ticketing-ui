"use client";

import { useEffect, type ReactNode } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useServicePermissions } from "@/hooks/useServicePermissions";
import { routePermissions } from "@/lib/nav";

/**
 * Sends a person who lacks a page's permission to the unauthorized page. The page permissions come
 * from the same nav definition the sidebar uses. The API enforces every permission on its own; this
 * only keeps people off screens that would fail.
 */
export function RouteGuard({ children }: { children: ReactNode }) {
  const params = useParams();
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const orgSlug = (params.orgSlug as string) || "";
  const { can, isLoading, role } = useServicePermissions(orgSlug);

  const rest = pathname.slice(orgSlug.length + 1) || "/";
  const needed = routePermissions(rest);
  const allowed = !needed || can(...needed);
  const decided = !isLoading && role !== null;

  useEffect(() => {
    if (decided && !allowed && !rest.startsWith("/unauthorized")) {
      router.replace(`/${orgSlug}/unauthorized`);
    }
  }, [decided, allowed, rest, orgSlug, router]);

  if (needed && (!decided || !allowed)) return null;
  return <>{children}</>;
}
