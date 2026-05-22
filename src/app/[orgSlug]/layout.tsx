"use client";

import { useState } from "react";
import { AuthProvider } from "@/providers/auth-provider";
import { BrandingProvider } from "@/providers/branding-provider";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { PWAUpdateBanner } from "@/components/pwa-update-banner";
import { PWARegistration } from "@/components/pwa-registration";

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthProvider>
      <BrandingProvider>
        <PWAUpdateBanner />
        <PWARegistration />
        <div className="flex min-h-dvh flex-col">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="flex-1 overflow-y-auto p-4 lg:p-6">
              {children}
            </main>
          </div>
        </div>
      </BrandingProvider>
    </AuthProvider>
  );
}
