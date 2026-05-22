'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useParams } from 'next/navigation';
import { useBranding } from '@/providers/branding-provider';
import { requestAppPermissions } from '@/hooks/use-app-permissions';
import { PWAUpdateBanner } from './pwa-update-banner';

const DISMISS_KEY = 'tkt_pwa_install_dismissed_until';
const INSTALLED_KEY = 'tkt_pwa_installed';
const DISMISS_DURATION = 24 * 60 * 60 * 1000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function getIsIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return (
    (/iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

function isRunningStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

function wasDismissedRecently(): boolean {
  try {
    const until = localStorage.getItem(DISMISS_KEY);
    return !!until && Date.now() < parseInt(until, 10);
  } catch {
    return false;
  }
}

export function PWARegistration() {
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) ?? '';
  const { tenant } = useBranding();

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  const appName = tenant?.orgName ? `${tenant.orgName} Ticketing` : 'BengoBox Ticketing';
  const logoUrl = tenant?.logoUrl ?? '/logo.png';

  // Inject dynamic manifest link
  useEffect(() => {
    if (!orgSlug) return;
    const manifestUrl = `/${orgSlug}/manifest.webmanifest`;
    let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    link.href = manifestUrl;
  }, [orgSlug]);

  useEffect(() => {
    const ios = getIsIOS();
    setIsIOS(ios);

    if (
      localStorage.getItem(INSTALLED_KEY) === 'true' ||
      isRunningStandalone() ||
      wasDismissedRecently()
    ) return;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    const handleAppInstalled = () => {
      localStorage.setItem(INSTALLED_KEY, 'true');
      setShowBanner(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (ios) setShowBanner(true);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem(INSTALLED_KEY, 'true');
      setShowBanner(false);
      requestAppPermissions();
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DURATION));
    setShowBanner(false);
    setShowIOSInstructions(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[90] p-3 animate-in slide-in-from-bottom duration-500">
      <div className="mx-auto max-w-lg bg-[#6366f1] text-white rounded-xl shadow-2xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={logoUrl}
              alt={appName}
              className="h-10 w-10 rounded-lg object-contain bg-white/20 p-1 shrink-0"
            />
            <div>
              <p className="font-semibold text-sm">{appName}</p>
              <p className="text-xs text-white/80 mt-0.5">
                Manage support tickets from your home screen.
              </p>
            </div>
          </div>
          <button onClick={handleDismiss} className="shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors" aria-label="Dismiss">
            <span className="text-sm leading-none">✕</span>
          </button>
        </div>

        {isIOS ? (
          !showIOSInstructions ? (
            <button
              onClick={() => setShowIOSInstructions(true)}
              className="mt-3 w-full bg-white text-[#6366f1] hover:bg-white/90 font-semibold text-sm py-2 rounded-lg transition-colors"
            >
              Show Me How
            </button>
          ) : (
            <div className="mt-3 space-y-2 rounded-lg bg-white/15 p-3 text-xs">
              <p>1. Tap the <strong>Share</strong> button in Safari&apos;s toolbar</p>
              <p>2. Scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong></p>
              <p>3. Tap <strong>&ldquo;Add&rdquo;</strong> to install</p>
              <button onClick={handleDismiss} className="mt-1 text-white/80 hover:text-white transition-colors">
                Got it, thanks!
              </button>
            </div>
          )
        ) : (
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleInstall}
              className="flex-1 bg-white text-[#6366f1] hover:bg-white/90 font-semibold text-sm py-2 rounded-lg transition-colors"
            >
              Install App
            </button>
            <button
              onClick={handleDismiss}
              className="text-white/80 hover:text-white text-sm px-3 transition-colors"
            >
              Not Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
