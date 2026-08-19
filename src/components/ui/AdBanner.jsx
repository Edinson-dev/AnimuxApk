import React, { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { DEMO_BANNERS, ADS_CONFIG } from '../../config/ads';

/**
 * ═══════════════════════════════════════════════════════════════════
 * AdBanner — Banner publicitario premium para la página principal.
 * Se muestra entre el Hero y el catálogo con un diseño elegante
 * que no rompe la experiencia visual de Animux.
 * ═══════════════════════════════════════════════════════════════════
 */
export default function AdBanner({ className = '' }) {
  const [currentBanner, setCurrentBanner] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Auto-rotate banners
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % DEMO_BANNERS.length);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  if (!ADS_CONFIG.enabled || !ADS_CONFIG.bannerEnabled || dismissed) return null;

  const banner = DEMO_BANNERS[currentBanner];

  const handleClick = () => {
    if (banner.link === '#install' || banner.link === '#premium') return;
    window.open(banner.link, '_blank', 'noopener');
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl lg:rounded-3xl border border-white/10 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${className}`}
    >
      {/* Gradient Background */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${banner.gradient} opacity-90`}
      />

      {/* Animated shine effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -inset-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
          style={{ animation: 'ad-shine 4s ease-in-out infinite' }}
        />
      </div>

      {/* Content */}
      <div
        onClick={handleClick}
        className="relative z-10 flex items-center justify-between gap-3 px-3.5 py-3 sm:px-5 sm:py-3.5 lg:px-8 lg:py-4 cursor-pointer group"
      >
        <div className="flex items-center gap-2.5 sm:gap-3 lg:gap-5 flex-1 min-w-0">
          <span className="text-xl sm:text-2xl lg:text-3xl shrink-0 group-hover:scale-110 transition-transform duration-300">
            {banner.icon}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-[11px] sm:text-xs lg:text-sm font-black text-white uppercase tracking-wider truncate">
              {banner.title}
            </h3>
            <p className="text-[10px] lg:text-xs text-white/70 font-medium truncate mt-0.5 hidden sm:block">
              {banner.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 lg:px-6 lg:py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl lg:rounded-2xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all border border-white/20 hover:border-white/40 group-hover:scale-105 whitespace-nowrap">
            <span>{banner.cta}</span>
            <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          </button>
        </div>
      </div>

      {/* Close Button */}
      {ADS_CONFIG.showCloseButton && (
        <button
          onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
          className="absolute top-2 right-2 lg:top-3 lg:right-3 p-1.5 bg-black/30 hover:bg-black/60 rounded-full text-white/60 hover:text-white transition-all z-20"
        >
          <X className="w-3 h-3" />
        </button>
      )}

      {/* AD Label */}
      <div className="absolute bottom-1.5 right-3 lg:bottom-2 lg:right-4 z-20">
        <span className="text-[7px] font-black text-white/30 uppercase tracking-[0.3em]">
          Anuncio
        </span>
      </div>

      {/* Dots indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
        {DEMO_BANNERS.map((_, i) => (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); setCurrentBanner(i); }}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              i === currentBanner ? 'bg-white w-4' : 'bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
