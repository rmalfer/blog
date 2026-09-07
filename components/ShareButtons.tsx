'use client';

import React, { useState } from 'react';
import { Share2, Check, Copy, MessageCircle } from 'lucide-react';

interface ShareButtonsProps {
  title: string;
  url?: string;
}

export function ShareButtons({ title, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== 'undefined' ? (url || window.location.href) : (url || '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const shareWhatsapp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} - ${shareUrl}`)}`, '_blank');
  };

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareLinkedin = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  return (
    <div className="flex items-center gap-2 py-3 border-y border-neutral-200 my-6">
      <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mr-2 flex items-center gap-1">
        <Share2 className="w-3.5 h-3.5" /> Compartilhar:
      </span>

      <button
        onClick={shareWhatsapp}
        aria-label="Compartilhar no WhatsApp"
        className="p-2 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
        title="WhatsApp"
      >
        <MessageCircle className="w-4 h-4" />
      </button>

      {/* LinkedIn SVG */}
      <button
        onClick={shareLinkedin}
        aria-label="Compartilhar no LinkedIn"
        className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
        title="LinkedIn"
      >
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
        </svg>
      </button>

      {/* X / Twitter SVG */}
      <button
        onClick={shareTwitter}
        aria-label="Compartilhar no X"
        className="p-2 rounded-full bg-neutral-100 text-neutral-800 hover:bg-neutral-200 transition-colors"
        title="X (Twitter)"
      >
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </button>

      <button
        onClick={handleCopy}
        aria-label="Copiar link"
        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors font-medium ml-auto"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-emerald-700 font-semibold">Copiado!</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            <span>Copiar link</span>
          </>
        )}
      </button>
    </div>
  );
}
