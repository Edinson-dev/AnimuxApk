import React from 'react';
import { Play, Info } from 'lucide-react';

export default function Hero({ featuredChannel, onPlay, onDetails }) {
  if (!featuredChannel) return null;

  const displayName = featuredChannel.displayName || featuredChannel.name;

  return (
    <div className="relative w-full h-[60vh] md:h-[80vh] overflow-hidden group mb-20 animate-fade-in bg-black">
      {/* Background Image - HBO Style (Vast, Atmospheric) */}
      <div className="absolute inset-0 z-0">
        <img 
          src={featuredChannel.logo} 
          alt={displayName}
          className="w-full h-full object-cover opacity-60 transition-transform duration-[20000ms] ease-linear scale-110 group-hover:scale-125"
          onError={(e) => { 
            e.target.onerror = null; 
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=000000&color=ffffff&size=1024&font-size=0.33&bold=true`; 
          }}
        />
        {/* Complex Gradients for HBO Look */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent"></div>
      </div>

      <div className="relative z-10 h-full flex flex-col justify-end p-8 md:p-24 max-w-5xl space-y-8">
        <div className="flex items-center gap-4">
          <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-white text-[10px] font-black tracking-[0.4em] uppercase rounded-full border border-white/10">PELÍCULA RECOMENDADA</span>
        </div>

        <div className="space-y-4">
           <h1 className="text-5xl md:text-8xl font-black leading-[0.85] tracking-tighter text-white uppercase italic drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
             {displayName}
           </h1>
           <p className="text-gray-300 text-sm md:text-xl font-medium leading-relaxed max-w-2xl line-clamp-3">
             {featuredChannel.description || 'Una experiencia visual sin precedentes. Sumérgete en esta producción exclusiva de Animux con la más alta calidad de streaming disponible.'}
           </p>
        </div>

        <div className="flex flex-wrap gap-5 pt-4">
          <button 
            onClick={() => onPlay(featuredChannel)}
            className="flex items-center gap-4 px-12 py-5 bg-white text-black rounded-full font-black text-xs md:text-sm hover:bg-gray-200 transition-all active:scale-95 shadow-2xl uppercase tracking-widest"
          >
            <Play className="w-5 h-5 fill-current" />
            REPRODUCIR
          </button>
          <button 
            onClick={() => onDetails(featuredChannel)}
            className="flex items-center gap-4 px-12 py-5 bg-white/10 backdrop-blur-xl text-white rounded-full font-black text-xs md:text-sm hover:bg-white/20 border border-white/20 transition-all active:scale-95 uppercase tracking-widest"
          >
            <Info className="w-5 h-5" />
            MÁS INFORMACIÓN
          </button>
        </div>
      </div>
    </div>
  );
}
