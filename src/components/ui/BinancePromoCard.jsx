import React, { useState } from 'react';
import { ExternalLink, Copy, Check, Sparkles } from 'lucide-react';
import { BINANCE_REFERRAL, ADS_CONFIG } from '../../config/ads';

export default function BinancePromoCard({ className = '' }) {
  const [copied, setCopied] = useState(false);

  if (!ADS_CONFIG.enabled || !ADS_CONFIG.binanceEnabled) return null;

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(BINANCE_REFERRAL.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpen = () => {
    window.open(BINANCE_REFERRAL.link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      onClick={handleOpen}
      className={`relative group overflow-hidden rounded-2xl border border-yellow-500/20 bg-[#121316]/90 hover:bg-[#181a20] backdrop-blur-xl transition-all duration-300 hover:border-yellow-500/40 cursor-pointer ${className}`}
    >
      {/* Subtle background glow */}
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative p-3 sm:p-4 flex items-center justify-between gap-3">
        {/* Left: Logo & Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#F0B90B] flex items-center justify-center shrink-0 shadow-md shadow-yellow-500/10 group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 120 120" className="w-5 h-5 fill-[#121316]">
              <path d="M60 15L74.1 29.1L49.1 54.1L35 40L60 15Z" />
              <path d="M85.9 40.9L100 55L85.9 69.1L71.8 55L85.9 40.9Z" />
              <path d="M60 65.9L74.1 80L60 94.1L45.9 80L60 65.9Z" />
              <path d="M34.1 40.9L48.2 55L34.1 69.1L20 55L34.1 40.9Z" />
              <path d="M60 40L70 50L60 60L50 50L60 40Z" />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black text-[#F0B90B] uppercase tracking-wider flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" /> Binance
              </span>
              <span className="text-[9px] text-gray-500 font-bold uppercase">• Bono $1,000 USD</span>
            </div>

            <p className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
              Descuentos en comisiones al registrarte
            </p>
          </div>
        </div>

        {/* Right: Copy code + CTA Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopy}
            title="Copiar código de referido"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-gray-300 hover:text-white transition-all"
          >
            <span className="text-[#F0B90B] font-bold">{BINANCE_REFERRAL.code}</span>
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-gray-400" />}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpen();
            }}
            className="px-3.5 py-2 bg-[#F0B90B] hover:bg-[#fcd535] text-black font-black text-[10px] sm:text-xs uppercase tracking-wider rounded-xl shadow-md shadow-yellow-500/20 transition-all flex items-center gap-1.5 active:scale-95 whitespace-nowrap"
          >
            <span>Reclamar</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
