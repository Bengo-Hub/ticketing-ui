import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact support",
  // The widget only makes sense inside a host site's panel, so search engines skip it.
  robots: { index: false, follow: false },
};

/**
 * The embeddable widget, framed by public/widget.js on a tenant's own site. next.config.ts lets
 * any site frame this route (frame-ancestors *) and no other.
 */
export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh overflow-x-hidden bg-background">{children}</div>;
}
