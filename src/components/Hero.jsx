import React from 'react';
import { Play, Info } from 'lucide-react';

export default function Hero({ featuredChannel, onPlay, onDetails }) {
  if (!featuredChannel) return null;

  const displayName = featuredChannel.displayName || featuredChannel.name;

  return (
    <div className="relative w-full h-[45vh] md:h-[65vh] rounded-[2rem] overflow-hidden group mb-16 shadow-2xl animate-fade-in border border-white/5 bg-[#0a0a0f]">
      {/* Background Image with Ken Burns effect */}
      <div className="absolute inset-0 z-0">
        <img 
          src={featuredChannel.logo} 
          alt={displayName}
          className="w-full h-full object-cover opacity-50 scale-110 group-hover:scale-100 transition-all duration-[10000ms] ease-out"
          onError={(e) => { 
            e.target.onerror = null; 
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1e1b4b&color=c7d2fe&size=512&font-size=0.33`; 
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060608] via-[#060608]/40 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#060608] via-transparent to-transparent"></div>
      </div>

      <div className="relative z-10 h-full flex flex-col justify-end p-8 md:p-16 max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-indigo-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black tracking-[0.4em] uppercase text-indigo-400">Contenido Destacado</span>
        </div>

        <h1 className="text-4xl md:text-7xl font-black leading-[0.9] tracking-tighter text-white animate-fade-in drop-shadow-2xl">
          {displayName}
        </h1>

        <p className="text-gray-400 text-sm md:text-lg font-medium leading-relaxed max-w-xl line-clamp-2 md:line-clamp-3">
          {featuredChannel.description || 'Sintoniza la mejor calidad cinematográfica con producciones originales y canales en vivo seleccionados bajo los más altos estándares de calidad.'}
        </p>

        <div className="flex flex-wrap gap-4 pt-4">
          <button 
            onClick={() => onPlay(featuredChannel)}
            className="flex items-center gap-3 px-10 py-4 bg-white text-black rounded-full font-black text-[11px] hover:bg-indigo-500 hover:text-white transition-all active:scale-95 shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
          >
            <Play className="w-4 h-4 fill-current ml-1" />
            REPRODUCIR AHORA
          </button>
          <button 
            onClick={() => onDetails(featuredChannel)}
            className="flex items-center gap-3 px-10 py-4 bg-white/5 backdrop-blur-xl text-white rounded-full font-black text-[11px] hover:bg-white/10 border border-white/10 transition-all active:scale-95 uppercase tracking-widest"
          >
            <Info className="w-4 h-4" />
            Detalles
          </button>
        </div>
      </div>
    </div>
  );
}
