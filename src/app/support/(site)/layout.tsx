import { SupportHeader } from "@/components/support/support-header";

/** The full public support pages: create, track and old ticket links, under the support header. */
export default function SupportSiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh overflow-x-hidden bg-muted/40">
      <SupportHeader />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}
