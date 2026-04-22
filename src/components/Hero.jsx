import React from 'react';
import { Play, Info, Star, Calendar, Clock } from 'lucide-react';

export default function Hero({ featuredChannel, onPlay, onDetails }) {
  if (!featuredChannel) return null;

  const displayName = featuredChannel.displayName || featuredChannel.name;

  return (
    <div className="relative w-full h-[60vh] md:h-[80vh] rounded-[2rem] overflow-hidden group mb-12 shadow-2xl animate-fade-in border border-white/5 bg-[#060608]">
      {/* Background Image with animated zoom */}
      <div className="absolute inset-0 z-0">
        <img 
          src={featuredChannel.logo} 
          alt={displayName}
          className="w-full h-full object-cover opacity-40 scale-110 group-hover:scale-100 transition-all duration-[5s] ease-out filter blur-[2px] md:blur-0"
          onError={(e) => { 
            e.target.onerror = null; 
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1e1b4b&color=c7d2fe&size=512&font-size=0.33`; 
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060608] via-[#060608]/60 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#060608] via-transparent to-transparent"></div>
      </div>

      <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-16 max-w-4xl pt-12">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 bg-indigo-600 rounded-full text-[10px] font-black tracking-widest uppercase text-white shadow-lg shadow-indigo-500/20">Destacado</span>
          <div className="flex items-center gap-1 text-yellow-500 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg">
            <Star className="w-3 h-3 fill-current" />
            <span className="text-[10px] font-black">8.4 HD</span>
          </div>
        </div>

        <h1 className="text-5xl md:text-8xl font-black mb-6 leading-[0.9] tracking-tighter text-premium">
          {displayName}
        </h1>

        <div className="flex items-center gap-6 text-gray-400 text-xs md:text-sm mb-8 font-medium">
             <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-indigo-400" /> 2024</span>
             <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-indigo-400" /> 1h 55min</span>
             <span className="px-2 py-0.5 border border-white/20 rounded text-[10px] text-white">4K ULTRA</span>
        </div>

        <p className="text-gray-300/80 text-sm md:text-lg mb-10 max-w-2xl leading-relaxed line-clamp-3 font-medium">
          Sintoniza la mejor calidad cinematográfica con "{displayName}". Contenido premium seleccionado bajo los más altos estándares de calidad exclusivamente para la plataforma Animux.
        </p>

        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => onPlay(featuredChannel)}
            className="group flex items-center gap-3 px-8 md:px-12 py-4 bg-white text-black rounded-full font-black text-sm md:text-base hover:bg-indigo-600 hover:text-white transition-all duration-500 shadow-xl shadow-white/5 active:scale-95"
          >
            <Play className="w-5 h-5 fill-current" />
            REPRODUCIR
          </button>
          <button 
            onClick={() => onDetails(featuredChannel)}
            className="flex items-center gap-3 px-8 md:px-10 py-4 bg-white/5 backdrop-blur-md text-white rounded-full font-bold text-sm md:text-base hover:bg-white/10 border border-white/10 transition-all active:scale-95 shadow-lg"
          >
            <Info className="w-5 h-5" />
            Ver Detalles
          </button>
        </div>
      </div>
    </div>
  );
}
