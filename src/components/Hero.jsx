import React, { useState, useEffect } from 'react';
import { Play, Info } from 'lucide-react';

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
    img.onerror = () => onResult(150, 10, 30);
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
    <div className="relative w-full h-[35vh] md:h-[52vh] overflow-hidden group mb-6 md:mb-10 animate-fade-in bg-black rounded-2xl border border-white/[0.05]">

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
          className="w-full h-full object-cover opacity-35 transition-transform duration-[10000ms] group-hover:scale-105"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0d0d0d&color=ffffff&size=512&bold=true`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/30 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-10 max-w-3xl space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest rounded">
              {featuredChannel.isNew ? 'Nuevo' : 'Destacado'}
            </span>
            {featuredChannel.category && (
              <span className="text-gray-400 text-[9px] font-bold uppercase tracking-widest">{featuredChannel.category}</span>
            )}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold leading-none tracking-tight text-white uppercase drop-shadow-2xl">
            {displayName}
          </h1>
          <p className="text-gray-400 text-[11px] md:text-xs leading-relaxed max-w-xl line-clamp-2 font-medium">
            {featuredChannel.description || 'Contenido premium disponible ahora en Animux. Streaming sin interrupciones.'}
          </p>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={() => onPlay(featuredChannel)}
            className="flex items-center gap-2 px-7 py-2.5 bg-white text-black rounded-full font-black text-[10px] md:text-xs hover:bg-gray-200 transition-all uppercase tracking-widest shadow-xl active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" /> Reproducir
          </button>
          <button
            onClick={() => onDetails(featuredChannel)}
            className="hidden sm:flex items-center gap-2 px-7 py-2.5 bg-white/10 backdrop-blur-xl text-white rounded-full font-bold text-[10px] md:text-xs hover:bg-white/20 border border-white/20 transition-all uppercase tracking-widest active:scale-95"
          >
            <Info className="w-4 h-4" /> Detalles
          </button>
        </div>
      </div>
    </div>
  );
}
