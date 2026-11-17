import { redirect } from "next/navigation";

/**
 * Old ticket links (/support/tickets/<token>) relied on an email-token API that ticketing-api
 * never had. They now land on /support/track, keeping any org, tenant or ticket query value;
 * the token in the path means nothing there and is dropped.
 */
export default async function LegacyTicketLink({
  searchParams,
}: {
  params: Promise<{ emailToken: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  for (const key of ["org", "tenant", "ticket"]) {
    const v = sp[key];
    const value = Array.isArray(v) ? v[0] : v;
    if (value) q.set(key, value);
  }
  const query = q.toString();
  redirect(query ? `/support/track?${query}` : "/support/track");
}
