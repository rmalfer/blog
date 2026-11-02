'use client';

import React, { useEffect } from 'react';

interface AdSenseSlotProps {
  slotId?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal';
  className?: string;
  label?: string;
}

export function AdSenseSlot({
  slotId = '',
  format = 'auto',
  className = '',
  label = 'PUBLICIDADE',
}: AdSenseSlotProps) {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-9812172654623216';
  const isConfigured = clientId && !clientId.includes('0000000000');
  const hasValidSlotId = slotId && /^\d+$/.test(slotId);

  useEffect(() => {
    if (isConfigured && hasValidSlotId && typeof window !== 'undefined') {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (err) {
        console.error('AdSense push error:', err);
      }
    }
  }, [isConfigured, hasValidSlotId]);

  if (!isConfigured || !hasValidSlotId) {
    return null;
  }

  return (
    <div className={`my-8 text-center ${className}`}>
      <div className="text-[10px] tracking-wider uppercase text-neutral-400 font-semibold mb-1">
        {label}
      </div>
      <div className="min-h-[100px] sm:min-h-[140px] flex items-center justify-center bg-neutral-50/50 rounded-lg p-2 transition-all overflow-hidden">
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={clientId}
          data-ad-slot={slotId}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}
