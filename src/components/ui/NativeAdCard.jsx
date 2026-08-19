import React from 'react';
import { ExternalLink } from 'lucide-react';
import { getRandomNativeAd, ADS_CONFIG } from '../../config/ads';

/**
 * ═══════════════════════════════════════════════════════════════════
 * NativeAdCard — Tarjeta de anuncio nativo que se mezcla
 * con las tarjetas de películas/series en el grid.
 * ═══════════════════════════════════════════════════════════════════
 */
const NativeAdCard = React.memo(function NativeAdCard() {
  if (!ADS_CONFIG.enabled || !ADS_CONFIG.inGridEnabled) return null;

  const ad = React.useMemo(() => getRandomNativeAd(), []);

  const handleClick = () => {
    window.open(ad.link, '_blank', 'noopener');
  };

  return (
    <div
      onClick={handleClick}
      className="group relative rounded-2xl lg:rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl hover:shadow-white/5 border border-white/10 hover:border-white/20"
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${ad.gradient}`} />

      {/* Pattern overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
        backgroundSize: '20px 20px'
      }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center p-4 aspect-[2/3] text-center">
        {/* Badge */}
        <div className="absolute top-2.5 left-2.5">
          <span className="px-2.5 py-1 bg-black/40 backdrop-blur-sm text-[7px] font-black text-amber-400 uppercase tracking-[0.2em] rounded-full border border-amber-500/20">
            {ad.badge}
          </span>
        </div>

        {/* Logo */}
        <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 shadow-xl">
          <img
            src={ad.logo}
            alt={ad.name}
            className="w-10 h-10 lg:w-12 lg:h-12 object-contain"
            onError={(e) => { e.target.src = '/icon-512.png'; }}
          />
        </div>

        {/* Title */}
        <h3 className="text-[11px] lg:text-xs font-black text-white uppercase tracking-tight leading-tight px-2">
          {ad.name}
        </h3>

        {/* CTA */}
        <div className="mt-3 flex items-center gap-1.5 px-4 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-[8px] font-black text-white uppercase tracking-widest transition-all border border-white/10 group-hover:border-white/30">
          Ver más
          <ExternalLink className="w-2.5 h-2.5" />
        </div>
      </div>

      {/* AD label */}
      <div className="absolute bottom-2 right-2.5 z-20">
        <span className="text-[6px] font-black text-white/20 uppercase tracking-[0.3em]">
          Ad
        </span>
      </div>
    </div>
  );
});

export default NativeAdCard;
