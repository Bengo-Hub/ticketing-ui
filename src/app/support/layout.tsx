import type { Metadata } from "next";
import { QueryClientWrapper } from "@/providers/query-client-wrapper";
import { SupportHeader } from "@/components/support/support-header";

export const metadata: Metadata = {
  title: "Customer Support",
  description: "Submit a support request or track your existing tickets.",
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientWrapper>
      <div className="min-h-dvh overflow-x-hidden bg-muted/40">
        <SupportHeader />
        <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">{children}</main>
      </div>
    </QueryClientWrapper>
  );
}
