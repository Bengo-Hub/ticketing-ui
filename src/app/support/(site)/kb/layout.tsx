import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help center",
  description: "Answers to common questions, and a way to contact support when you need more help.",
};

/** The public help center at /support/kb?org=<slug>, inside the public support layout. */
export default function HelpCenterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
