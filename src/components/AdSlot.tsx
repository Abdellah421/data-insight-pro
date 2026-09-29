import React from 'react';

interface AdSlotProps {
  slotId: string;
  format?: 'horizontal' | 'rectangle' | 'banner';
  className?: string;
}

/**
 * Reusable AdSlot component for future monetization architecture.
 * Live ads are currently disabled for phase 0/1.
 * Provides a clean, non-intrusive placeholder wrapper.
 */
export const AdSlot: React.FC<AdSlotProps> = ({ slotId, format = 'horizontal', className = '' }) => {
  // Ads disabled for current phase
  const isAdsEnabled = false;

  if (!isAdsEnabled) {
    return null;
  }

  return (
    <div
      data-ad-slot={slotId}
      data-ad-format={format}
      className={`ad-slot bg-gray-50 border border-dashed border-gray-200 rounded-lg flex items-center justify-center p-4 text-xs text-gray-400 my-6 ${className}`}
    >
      <span>Advertisement Space ({slotId})</span>
    </div>
  );
};

export default AdSlot;
