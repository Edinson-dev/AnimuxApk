import React from 'react';
import { Play, Info } from 'lucide-react';

export default function Hero({ featuredChannel, onPlay, onDetails }) {
  if (!featuredChannel) return null;

  const displayName = featuredChannel.displayName || featuredChannel.name;

  return (
    <div className="relative w-full h-[40vh] md:h-[60vh] rounded-[2rem] overflow-hidden group mb-12 shadow-2xl animate-fade-in border border-white/5 bg-[#0a0a0f]">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={featuredChannel.logo} 
          alt={displayName}
          className="w-full h-full object-cover opacity-40 transition-all duration-700"
          onError={(e) => { 
            e.target.onerror = null; 
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1e1b4b&color=c7d2fe&size=512&font-size=0.33`; 
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060608] via-[#060608]/20 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#060608] via-transparent to-transparent"></div>
      </div>

      <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-12 max-w-4xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 bg-indigo-600 rounded text-[8px] font-black tracking-widest uppercase text-white">RECOMENDADO</span>
        </div>

        <h1 className="text-3xl md:text-6xl font-black mb-4 leading-tight tracking-tighter text-white">
          {displayName}
        </h1>

        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => onPlay(featuredChannel)}
            className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-black text-xs hover:bg-indigo-600 hover:text-white transition-all active:scale-95 shadow-xl"
          >
            <Play className="w-4 h-4 fill-current ml-1" />
            REPRODUCIR
          </button>
          <button 
            onClick={() => onDetails(featuredChannel)}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 backdrop-blur-md text-white rounded-xl font-bold text-xs hover:bg-white/10 border border-white/10 transition-all active:scale-95"
          >
            <Info className="w-4 h-4" />
            Detalles
          </button>
        </div>
      </div>
    </div>
  );
}
