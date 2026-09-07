'use client';

import React, { useEffect } from 'react';

interface AdSenseSlotProps {
  slotId?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal';
  className?: string;
  label?: string;
}

export function AdSenseSlot({
  slotId = '0000000000',
  format = 'auto',
  className = '',
  label = 'PUBLICIDADE',
}: AdSenseSlotProps) {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const isConfigured = clientId && !clientId.includes('0000000000');

  useEffect(() => {
    if (isConfigured && typeof window !== 'undefined') {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (err) {
        console.error('AdSense push error:', err);
      }
    }
  }, [isConfigured]);

  return (
    <div className={`my-8 text-center ${className}`}>
      <div className="text-[10px] tracking-wider uppercase text-neutral-400 font-semibold mb-1">
        {label}
      </div>
      <div className="min-h-[100px] sm:min-h-[140px] flex items-center justify-center bg-neutral-50 border border-dashed border-neutral-200 rounded-lg p-4 transition-all">
        {isConfigured ? (
          <ins
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client={clientId}
            data-ad-slot={slotId}
            data-ad-format={format}
            data-full-width-responsive="true"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-neutral-400 py-3">
            <span className="text-xs font-mono font-medium text-neutral-500">
              Espaço Google AdSense ({format})
            </span>
            <span className="text-[11px] text-neutral-400 mt-1">
              Pronto para exibição de anúncios no portal
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
