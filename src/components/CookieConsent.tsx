import React, { useEffect, useState } from 'react';

export const CONSENT_KEY = 'dip-consent';
export const CONSENT_EVENT = 'dip-consent-changed';

export function getConsent(): string | null {
  try {
    return window.localStorage.getItem(CONSENT_KEY);
  } catch {
    return null;
  }
}

function setConsent(value: 'accepted' | 'declined') {
  try {
    window.localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* storage unavailable (private mode) — banner will simply reappear next visit */
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

/**
 * GDPR-style cookie consent banner.
 * - Fixed bottom banner, shown only until the visitor chooses.
 * - Choice is stored in localStorage under `dip-consent` ("accepted" | "declined").
 * - No advertising script is loaded anywhere on the site before consent = "accepted"
 *   (the AdSense loader in AdSlot.tsx checks this same key before injecting its script).
 */
export const CookieConsent: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getConsent() === null) setVisible(true);
  }, []);

  if (!visible) return null;

  const choose = (value: 'accepted' | 'declined') => {
    setConsent(value);
    setVisible(false);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 pointer-events-none">
      <div className="pointer-events-auto max-w-4xl mx-auto rounded-2xl bg-gray-900 text-white shadow-2xl border border-gray-700 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <p className="text-sm leading-relaxed flex-1">
          We use cookies to improve your experience and (soon) to serve ads. See our{' '}
          <a href="/privacy" className="underline text-blue-300 hover:text-blue-200">
            Privacy Policy
          </a>{' '}
          for details.
        </p>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={() => choose('declined')}
            className="px-4 py-2.5 rounded-xl border border-gray-500 text-sm font-semibold text-gray-200 hover:bg-gray-800 transition"
          >
            Decline
          </button>
          <button
            onClick={() => choose('accepted')}
            className="px-4 py-2.5 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
