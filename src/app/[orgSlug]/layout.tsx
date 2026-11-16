"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AuthProvider } from "@/providers/auth-provider";
import { BrandingProvider } from "@/providers/branding-provider";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { StaleChunkRecovery } from "@bengo-hub/shared-ui-lib/offline";
import { PWARegistration } from "@/components/pwa-registration";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

function ManifestInjector() {
  const params = useParams();
  const orgSlug = params?.orgSlug as string | undefined;
  useEffect(() => {
    if (!orgSlug) return;
    const href = `/${orgSlug}/manifest.webmanifest`;
    let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    if (link.href !== new URL(href, window.location.href).href) {
      link.href = href;
    }
  }, [orgSlug]);
  return null;
}

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthProvider>
      <BrandingProvider>
        <ManifestInjector />
        <StaleChunkRecovery />
        <PWARegistration />
        <div className="flex min-h-dvh flex-col">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            {/* Bottom padding keeps content clear of the phone bottom bar and the iOS home indicator. */}
            <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:p-6 lg:pb-6">
              <RouteGuard>{children}</RouteGuard>
            </main>
          </div>
          <MobileBottomNav onOpenMenu={() => setSidebarOpen(true)} />
        </div>
      </BrandingProvider>
    </AuthProvider>
  );
}
