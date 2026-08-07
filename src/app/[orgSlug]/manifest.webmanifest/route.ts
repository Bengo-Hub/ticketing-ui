import { NextResponse } from 'next/server';

const AUTH_API_URL =
  process.env.NEXT_PUBLIC_AUTH_API_URL ||
  process.env.NEXT_PUBLIC_SSO_URL ||
  'https://sso.codevertexafrica.com';

interface TenantBrand {
  name?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  orgName?: string | null;
  metadata?: Record<string, unknown>;
}

async function fetchTenant(slug: string): Promise<TenantBrand | null> {
  try {
    const res = await fetch(
      `${AUTH_API_URL}/api/v1/tenants/by-slug/${encodeURIComponent(slug)}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const meta = (data.metadata ?? {}) as Record<string, unknown>;
    const logoUrl = (meta.logo_url ?? meta.logoUrl ?? null) as string | null;
    const primaryColor = (meta.primary_color ?? meta.primaryColor ?? null) as string | null;
    const orgName = (meta.org_name ?? meta.orgName ?? data.name ?? null) as string | null;
    return { name: data.name, orgName, logoUrl, primaryColor };
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  const { orgSlug } = await params;
  const tenant = await fetchTenant(orgSlug);

  const appName = tenant?.orgName
    ? `${tenant.orgName} Ticketing`
    : 'Codevertex Ticketing';

  const manifest = {
    name: appName,
    short_name: tenant?.orgName ?? 'Ticketing',
    description: 'Multi-tenant customer support and helpdesk ticketing',
    start_url: `/${orgSlug}/`,
    scope: `/${orgSlug}/`,
    display: 'standalone',
    orientation: 'portrait-primary',
    theme_color: tenant?.primaryColor ?? '#6366f1',
    background_color: '#f8fafc',
    categories: ['productivity', 'business'],
    icons: [
      {
        src: tenant?.logoUrl ?? '/logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: tenant?.logoUrl ?? '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
