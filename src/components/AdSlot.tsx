import React, { useEffect, useRef } from 'react';

interface AdSlotProps {
  slotId: string;
  format?: 'horizontal' | 'rectangle' | 'banner';
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

// Set this in Vercel: Project Settings -> Environment Variables ->
//   VITE_ADSENSE_CLIENT_ID = ca-pub-XXXXXXXXXXXXXXXX
// then redeploy. Until it is set, this component renders nothing.
const PUBLISHER_ID = (import.meta.env.VITE_ADSENSE_CLIENT_ID as string | undefined)?.trim();

let scriptInjected = false;
function ensureAdSenseScript() {
  if (scriptInjected || document.querySelector('script[data-adsense-script]')) {
    scriptInjected = true;
    return;
  }
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUBLISHER_ID}`;
  s.crossOrigin = 'anonymous';
  s.setAttribute('data-adsense-script', 'true');
  document.head.appendChild(s);
  scriptInjected = true;
}

/**
 * Responsive Google AdSense slot.
 * Renders nothing until VITE_ADSENSE_CLIENT_ID is set and the site is approved.
 * In your AdSense dashboard, turn ON "Auto ads" so Google can fill these units.
 * Existing placements: LandingPage ("landing-between-steps"), ToolPage ("tool-{id}-top").
 */
export const AdSlot: React.FC<AdSlotProps> = ({ slotId, className = '' }) => {
  const pushedRef = useRef(false);

  useEffect(() => {
    if (!PUBLISHER_ID || pushedRef.current) return;
    pushedRef.current = true;
    ensureAdSenseScript();
    const t = window.setTimeout(() => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        /* AdSense not ready yet — Auto ads will handle it */
      }
    }, 300);
    return () => window.clearTimeout(t);
  }, [slotId]);

  // No publisher ID yet -> render nothing (site works exactly as before)
  if (!PUBLISHER_ID) return null;

  return (
    <div className={`my-6 flex w-full justify-center ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client={PUBLISHER_ID}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default AdSlot;
