'use client';

import { usePWAUpdate } from '@/hooks/use-pwa-update';
import { useState } from 'react';

export function PWAUpdateBanner() {
  const { updateAvailable, applyUpdate } = usePWAUpdate();
  const [dismissed, setDismissed] = useState(false);

  if (!updateAvailable || dismissed) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[100] bg-[#6366f1] text-white px-4 py-2.5 flex items-center justify-between gap-3 shadow-lg">
      <span className="text-sm font-medium">A new version is available</span>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={applyUpdate}
          className="bg-white text-[#6366f1] hover:bg-white/90 font-semibold text-xs px-3 py-1 rounded-md transition-colors"
        >
          Update Now
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-white/80 hover:text-white text-xs transition-colors"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
