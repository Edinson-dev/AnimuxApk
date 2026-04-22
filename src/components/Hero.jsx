import React from 'react';
import { Play, Info } from 'lucide-react';

export default function Hero({ featuredChannel, onPlay, onDetails }) {
  if (!featuredChannel) return null;

  const displayName = featuredChannel.displayName || featuredChannel.name;

  return (
    <div className="relative w-full h-[45vh] md:h-[55vh] overflow-hidden group mb-8 md:mb-12 animate-fade-in bg-black rounded-3xl border border-white/5">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={featuredChannel.logo} 
          alt={displayName}
          className="w-full h-full object-cover opacity-40 transition-transform duration-[10000ms] group-hover:scale-110"
          onError={(e) => { 
            e.target.onerror = null; 
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=000000&color=ffffff&size=1024&font-size=0.33&bold=true`; 
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/20 to-transparent"></div>
      </div>

      <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-12 max-w-4xl space-y-4 md:space-y-6">
        <div className="space-y-2">
           <h1 className="text-4xl md:text-6xl font-normal leading-none tracking-tight text-white uppercase italic drop-shadow-2xl">
             {displayName}
           </h1>
           <p className="text-gray-400 text-[10px] md:text-xs font-bold leading-relaxed max-w-xl line-clamp-2 uppercase tracking-widest opacity-80">
             {featuredChannel.description || 'Contenido premium disponible ahora en Animux. Calidad de imagen superior y streaming sin interrupciones.'}
           </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button 
            onClick={() => onPlay(featuredChannel)}
            className="flex items-center gap-2 px-8 py-3 bg-white text-black rounded-full font-bold text-[10px] md:text-xs hover:bg-gray-200 transition-all uppercase tracking-widest"
          >
            <Play className="w-4 h-4 fill-current" />
            REPRODUCIR
          </button>
          <button 
            onClick={() => onDetails(featuredChannel)}
            className="hidden sm:flex items-center gap-2 px-8 py-3 bg-white/10 backdrop-blur-xl text-white rounded-full font-bold text-[10px] md:text-xs hover:bg-white/20 border border-white/20 transition-all uppercase tracking-widest"
          >
            <Info className="w-4 h-4" />
            DETALLES
          </button>
        </div>
      </div>
    </div>
  );
}
