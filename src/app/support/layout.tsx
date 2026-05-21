import type { Metadata } from "next";
import { QueryClientWrapper } from "@/providers/query-client-wrapper";

export const metadata: Metadata = {
  title: "Customer Support",
  description: "Submit a support request or track your existing tickets.",
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientWrapper>
      <div className="min-h-dvh bg-gray-50">
        <header className="border-b bg-white shadow-sm">
          <div className="mx-auto max-w-3xl px-4 py-4">
            <h1 className="text-lg font-semibold text-gray-900">Customer Support</h1>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
      </div>
    </QueryClientWrapper>
  );
}
