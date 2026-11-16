'use client';

import { PwaInstallPrompt } from '@bengo-hub/shared-ui-lib/offline';
import { requestAppPermissions } from '@/hooks/use-app-permissions';
import { useBranding } from '@/providers/branding-provider';

/**
 * The fleet's install banner (shared-ui-lib PwaInstallPrompt), mounted once inside the tenant
 * branding so it carries the tenant's app name and logo. It sits above the phone bottom bar.
 */
export function PWARegistration() {
  const { tenant, getServiceTitle } = useBranding();
  return (
    <PwaInstallPrompt
      appName={getServiceTitle('Ticketing')}
      logoUrl={tenant?.logoUrl ?? '/logo.png'}
      tagline="Answer tickets and follow up from your phone."
      dismissKey="tkt_pwa_install_dismissed_until"
      onInstalled={requestAppPermissions}
      className="mb-20 lg:mb-0"
    />
  );
}
