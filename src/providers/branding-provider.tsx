"use client";

import { fetchTenantBySlug, type TenantBrand } from "@/lib/api/tenant";
import { useParams } from "next/navigation";
import { createContext, ReactNode, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

interface BrandingContextType {
  slug: string;
  tenant: TenantBrand | null;
  isLoading: boolean;
  error: Error | null;
  getServiceTitle: (appName: string) => string;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

const DEFAULT_BRAND: TenantBrand = {
  id: "platform",
  name: "Codevertex",
  slug: "codevertex",
  logoUrl: "/logo.png",
  primaryColor: "#6366f1",
  secondaryColor: "#8b5cf6",
  orgName: "Codevertex Africa Limited",
};

export function BrandingProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const slug = (params?.orgSlug as string) || "";

  const { data: tenant, isLoading, error } = useQuery({
    queryKey: ["tenant", slug],
    queryFn: () => fetchTenantBySlug(slug),
    staleTime: 6 * 60 * 60 * 1000,
    enabled: !!slug,
  });

  const effectiveBrand = useMemo(() => {
    if (tenant) return tenant;
    if (!isLoading && !tenant && slug) {
      return { ...DEFAULT_BRAND, slug, name: slug, orgName: slug };
    }
    return DEFAULT_BRAND;
  }, [tenant, isLoading, slug]);

  useMemo(() => {
    if (typeof window !== "undefined") {
      const primary = effectiveBrand?.primaryColor || DEFAULT_BRAND.primaryColor!;
      document.documentElement.style.setProperty("--tenant-primary", primary);
    }
  }, [effectiveBrand]);

  const getServiceTitle = (appName: string) => {
    const tenantName = effectiveBrand?.orgName || effectiveBrand?.name || "";
    const firstWord = tenantName.split(" ")[0] || "Codevertex";
    return `${firstWord} ${appName}`;
  };

  const value = useMemo(
    () => ({
      slug,
      tenant: effectiveBrand,
      isLoading,
      error: error as Error | null,
      getServiceTitle,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slug, effectiveBrand, isLoading, error],
  );

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (!context) {
    return {
      slug: "",
      tenant: null,
      isLoading: false,
      error: null,
      getServiceTitle: (s: string) => s,
    };
  }
  return context;
};
