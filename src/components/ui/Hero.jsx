import React, { useState, useEffect } from 'react';
import { Play, Info, Shield, Sparkles, Star, Film, Calendar } from 'lucide-react';
import { useTranslation } from '../../utils/i18n.jsx';

const getDominantColor = (imgSrc, onResult) => {
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 4; canvas.height = 4;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 4, 4);
        const data = ctx.getImageData(0, 0, 4, 4).data;
        let r = 0, g = 0, b = 0;
        const pixels = data.length / 4;
        for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i+1]; b += data[i+2]; }
        onResult(Math.round(r/pixels), Math.round(g/pixels), Math.round(b/pixels));
      } catch { onResult(150, 10, 30); }
    };
    img.src = imgSrc;
  } catch { onResult(150, 10, 30); }
};

export default function Hero({ featuredChannel, onPlay, onDetails }) {
  const { t, translateCategory } = useTranslation();
  const [bgRgb, setBgRgb] = useState('150,10,30');

  const heroImage = featuredChannel?.backdrop || featuredChannel?.poster || featuredChannel?.logo;

  useEffect(() => {
    if (heroImage) {
      getDominantColor(heroImage, (r, g, b) => setBgRgb(`${r},${g},${b}`));
    }
  }, [heroImage]);

  if (!featuredChannel) return null;

  const displayName = featuredChannel.displayName || featuredChannel.title || featuredChannel.name || t('featured_title');
  const description = featuredChannel.description || featuredChannel.synopsis || t('default_hero_desc');
  const year = featuredChannel.year || '2024';
  const categoryLabel = translateCategory(featuredChannel.category);

  return (
    <div className="relative w-full min-h-[340px] sm:min-h-[400px] md:h-[68vh] md:min-h-[480px] max-h-[720px] flex flex-col justify-end overflow-hidden group mb-4 md:mb-8 animate-fade-in bg-[#070709] rounded-2xl md:rounded-3xl border border-white/[0.1] shadow-[0_20px_50px_rgba(0,0,0,0.9)]">

      {/* Adaptive ambient color glow */}
      <div
        className="absolute inset-0 z-0 transition-all duration-1000 pointer-events-none opacity-60"
        style={{ background: `radial-gradient(ellipse at 25% 65%, rgba(${bgRgb},0.55) 0%, transparent 70%)` }}
      />

      {/* Background Poster Image */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={heroImage}
          alt={displayName}
          className="w-full h-full object-cover object-top opacity-70 group-hover:scale-105 transition-transform duration-1000 animate-ken-burns"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0d0d0d&color=ffffff&size=512&bold=true`;
          }}
        />
        {/* Cinematic Multi-angle Shadow Gradients for 100% text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-[#070709]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070709] via-[#070709]/60 to-transparent max-w-3xl" />
        <div className="absolute inset-0 bg-black/25" />
      </div>

      {/* Content pinned to bottom with clean hierarchy */}
      <div className="relative z-10 w-full p-4 sm:p-7 md:p-12 max-w-4xl space-y-3.5 md:space-y-5">
        
        <div className="space-y-2 md:space-y-3">
          
          {/* Metadata Badges Row */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap animate-slide-up">
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-rose-600 to-rose-700 text-white text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-rose-600/30">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              {featuredChannel.isNew ? t('exclusive_premiere') : t('trending')}
            </span>

            {categoryLabel && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-white/10 backdrop-blur-md border border-white/15 text-gray-200 text-[9px] md:text-[10px] font-black uppercase tracking-wider rounded-full">
                <Film className="w-2.5 h-2.5 text-rose-400" />
                {categoryLabel}
              </span>
            )}

            <span className="flex items-center gap-1 px-2.5 py-1 bg-white/5 backdrop-blur-md border border-white/10 text-gray-300 text-[9px] md:text-[10px] font-bold rounded-full">
              <Calendar className="w-2.5 h-2.5 text-gray-400" />
              {year}
            </span>

            <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-rose-300 text-[9px] md:text-[10px] font-black tracking-widest rounded-md uppercase hidden min-[480px]:inline">
              4K Ultra HD
            </span>

            <span className="flex items-center gap-1 px-2.5 py-1 bg-green-500/10 border border-green-500/25 text-green-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-full backdrop-blur-md hidden sm:flex">
              <Shield className="w-2.5 h-2.5 text-green-400" />
              <span>{t('safe_badge')}</span>
            </span>
          </div>
          
          {/* Main Title */}
          <h1 className="text-2xl sm:text-4xl md:text-6xl font-black text-white uppercase tracking-tight leading-[1.05] line-clamp-2 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] animate-slide-up animation-delay-100">
            {displayName}
          </h1>
          
          {/* Synopsis / Description */}
          <p className="text-xs sm:text-sm md:text-base text-gray-300 font-medium max-w-2xl line-clamp-2 md:line-clamp-3 leading-relaxed drop-shadow-md animate-slide-up animation-delay-200">
            {description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 md:gap-4 pt-1 animate-slide-up animation-delay-300">
          <button
            onClick={() => onPlay(featuredChannel)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-6 py-3.5 md:px-9 md:py-4 bg-gradient-to-r from-rose-600 via-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-2xl font-black text-xs md:text-sm uppercase tracking-[0.15em] transition-all shadow-xl shadow-rose-600/40 hover:shadow-rose-600/60 active:scale-95 group/btn cursor-pointer"
          >
            <Play className="w-4 h-4 md:w-5 md:h-5 fill-current transition-transform group-hover/btn:scale-110" />
            {t('play')}
          </button>
          
          <button
            onClick={() => onDetails(featuredChannel)}
            className="flex items-center justify-center gap-2 px-4 py-3.5 md:px-7 md:py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/35 rounded-2xl font-black text-xs md:text-sm uppercase tracking-[0.15em] backdrop-blur-xl transition-all active:scale-95 cursor-pointer shadow-lg"
            title={t('details')}
          >
            <Info className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">{t('info')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
