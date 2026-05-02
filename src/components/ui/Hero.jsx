import React, { useState, useEffect } from 'react';
import { Play, Info, Shield } from 'lucide-react';

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
  const [bgRgb, setBgRgb] = useState('150,10,30');

  useEffect(() => {
    if (featuredChannel?.logo) {
      getDominantColor(featuredChannel.logo, (r, g, b) => setBgRgb(`${r},${g},${b}`));
    }
  }, [featuredChannel?.logo]);

  if (!featuredChannel) return null;

  const displayName = featuredChannel.displayName || featuredChannel.name;

  return (
    <div className="relative w-full h-[38vh] md:h-[65vh] overflow-hidden group mb-6 md:mb-10 animate-fade-in bg-[#05050f] rounded-2xl md:rounded-3xl border-none">

      {/* Adaptive color glow */}
      <div
        className="absolute inset-0 z-0 transition-all duration-1000"
        style={{ background: `radial-gradient(ellipse at 30% 60%, rgba(${bgRgb},0.45) 0%, transparent 65%)` }}
      />

      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={featuredChannel.logo}
          alt={displayName}
          className="w-full h-full object-cover opacity-50 animate-ken-burns"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0d0d0d&color=ffffff&size=512&bold=true`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/30 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-12 max-w-4xl space-y-4 md:space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3 animate-slide-up">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-600 text-white text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-rose-600/30">
              <span className="w-1 h-1 bg-white rounded-full animate-pulse" />
              {featuredChannel.isNew ? 'Estreno Exclusivo' : 'Tendencia'}
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-green-500/10 backdrop-blur-md">
              <Shield className="w-3 h-3" />
              <span className="hidden md:inline">Transmisión Segura</span>
              <span className="md:hidden">Seguro</span>
            </span>
            <span className="text-white/40 text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] hidden lg:block">
              Animux Original • Premium
            </span>
          </div>
          
          <h1 className="text-3xl md:text-7xl font-black text-white uppercase tracking-tighter leading-[0.9] animate-slide-up animation-delay-100">
            {displayName}
          </h1>
          
          <p className="text-xs md:text-lg text-gray-300 font-medium max-w-2xl line-clamp-2 md:line-clamp-3 animate-slide-up animation-delay-200">
            {featuredChannel.description || 'Disfruta de la mejor calidad de imagen y sonido envolvente. Solo aquí en la plataforma líder de streaming.'}
          </p>
        </div>

        <div className="flex items-center gap-3 md:gap-4 pt-2 animate-slide-up animation-delay-300">
          <button
            onClick={() => onPlay(featuredChannel)}
            className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black text-xs md:text-sm uppercase tracking-[0.2em] transition-all shadow-xl shadow-rose-600/20 active:scale-95 group/btn"
          >
            <Play className="w-5 h-5 fill-current transition-transform group-hover/btn:scale-110" />
            Reproducir
          </button>
          
          <button
            onClick={() => onDetails(featuredChannel)}
            className="flex items-center justify-center gap-3 px-6 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-black text-xs md:text-sm uppercase tracking-[0.2em] transition-all active:scale-95"
          >
            <Info className="w-5 h-5" />
            <span className="hidden md:inline">Info</span>
          </button>
        </div>
      </div>
    </div>
  );
}
