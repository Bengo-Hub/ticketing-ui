import type { Metadata } from "next";
import { QueryClientWrapper } from "@/providers/query-client-wrapper";

export const metadata: Metadata = {
  title: "Customer Support",
  description: "Submit a support request or track your existing tickets.",
};

/**
 * Shared by every public support route. The full pages add their header in (site)/layout.tsx;
 * the embeddable widget at /support/widget has its own compact frame.
 */
export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return <QueryClientWrapper>{children}</QueryClientWrapper>;
}
