"use client";

import type { ReactNode } from "react";
import { useParams } from "next/navigation";
import { TenantBrandingProvider, useTenantBranding } from "@bengo-hub/shared-ui-lib/tenant";
import { AUTH_API_URL } from "@/lib/api/tenant";

/** This app's key in tenant metadata service_branding (same key as the app-switcher registry). */
export const SERVICE_KEY = "ticketing";

/** Mounts the shared tenant branding for the tenant in the URL. */
export function BrandingProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const slug = (params?.orgSlug as string) || "";
  return (
    <TenantBrandingProvider slug={slug} authApiBase={AUTH_API_URL} defaultPrimaryColor="#6366f1" defaultSecondaryColor="#8b5cf6">
      {children}
    </TenantBrandingProvider>
  );
}

/** Tenant brand plus this app's title, from the shared provider. */
export function useBranding() {
  const ctx = useTenantBranding();
  return {
    ...ctx,
    getServiceTitle: (appName: string) => ctx.getServiceTitle(appName, SERVICE_KEY),
  };
}
