import React, { useState, useEffect, useCallback } from 'react';
import { Play, X, Volume2 } from 'lucide-react';
import { ADS_CONFIG, DEMO_BANNERS, shouldShowPreroll, markPrerollShown } from '../../config/ads';

/**
 * ═══════════════════════════════════════════════════════════════════
 * PrerollAd — Overlay de cuenta regresiva que aparece antes de
 * reproducir un video. Muestra un anuncio durante X segundos
 * con opción de "Skip" cuando termina la cuenta.
 * ═══════════════════════════════════════════════════════════════════
 */
export default function PrerollAd({ onComplete, channelName = '' }) {
  const [countdown, setCountdown] = useState(ADS_CONFIG.prerollDuration);
  const [canSkip, setCanSkip] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const banner = React.useMemo(
    () => DEMO_BANNERS[Math.floor(Math.random() * DEMO_BANNERS.length)],
    []
  );

  const handleSkip = useCallback(() => {
    setIsExiting(true);
    markPrerollShown();
    setTimeout(() => onComplete(), 400);
  }, [onComplete]);

  useEffect(() => {
    if (countdown <= 0) {
      setCanSkip(true);
      return;
    }
    const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Auto-skip after countdown + 3 extra seconds
  useEffect(() => {
    const autoSkip = setTimeout(() => {
      handleSkip();
    }, (ADS_CONFIG.prerollDuration + 3) * 1000);
    return () => clearTimeout(autoSkip);
  }, [handleSkip]);

  const handleAdClick = () => {
    if (banner.link.startsWith('#')) return;
    window.open(banner.link, '_blank', 'noopener');
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-500 ${
        isExiting ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
      }`}
    >
      {/* Dark backdrop */}
      <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" />

      {/* Animated rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] border border-white/[0.02] rounded-full animate-ping" style={{ animationDuration: '3s' }} />
        <div className="absolute w-[300px] h-[300px] border border-white/[0.03] rounded-full animate-ping" style={{ animationDuration: '2s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 max-w-md w-full px-6">

        {/* Now playing info */}
        <div className="flex items-center gap-2 text-gray-500">
          <Play className="w-3 h-3" />
          <span className="text-[9px] font-black uppercase tracking-[0.3em]">
            Preparando reproducción
          </span>
        </div>

        {/* Channel name */}
        <h2 className="text-lg font-black text-white/40 uppercase tracking-tight text-center truncate max-w-full">
          {channelName}
        </h2>

        {/* Ad Banner Card */}
        <div
          onClick={handleAdClick}
          className={`w-full rounded-3xl overflow-hidden border border-white/10 hover:border-white/20 cursor-pointer group transition-all duration-500 hover:scale-[1.02]`}
        >
          <div className={`relative bg-gradient-to-r ${banner.gradient} p-6 lg:p-8`}>
            {/* Shine effect */}
            <div className="absolute inset-0 overflow-hidden">
              <div
                className="absolute -inset-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                style={{ animation: 'ad-shine 3s ease-in-out infinite' }}
              />
            </div>

            <div className="relative z-10 flex flex-col items-center text-center gap-3">
              <span className="text-4xl group-hover:scale-110 transition-transform">
                {banner.icon}
              </span>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                {banner.title}
              </h3>
              <p className="text-[10px] text-white/70 font-medium">
                {banner.description}
              </p>
              <button className="mt-2 px-6 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest border border-white/20 transition-all">
                {banner.cta}
              </button>
            </div>

            {/* Ad label */}
            <div className="absolute bottom-2 right-3">
              <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.3em]">
                Anuncio
              </span>
            </div>
          </div>
        </div>

        {/* Countdown / Skip */}
        <div className="flex flex-col items-center gap-3">
          {canSkip ? (
            <button
              onClick={handleSkip}
              className="flex items-center gap-2.5 px-8 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-rose-600/30 hover:scale-105 active:scale-95 animate-pulse"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Reproducir Ahora
            </button>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {/* Circular progress */}
              <div className="relative w-14 h-14">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                  <circle
                    cx="28" cy="28" r="24"
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="28" cy="28" r="24"
                    fill="none"
                    stroke="#e11d48"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 24}
                    strokeDashoffset={2 * Math.PI * 24 * (countdown / ADS_CONFIG.prerollDuration)}
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-black text-white">{countdown}</span>
                </div>
              </div>
              <span className="text-[8px] font-black text-gray-600 uppercase tracking-[0.3em]">
                El video comenzará pronto
              </span>
            </div>
          )}
        </div>

        {/* Mute indicator */}
        <div className="flex items-center gap-2 text-gray-700">
          <Volume2 className="w-3 h-3" />
          <span className="text-[7px] font-black uppercase tracking-[0.3em]">
            Audio activado al reproducir
          </span>
        </div>
      </div>
    </div>
  );
}
