import React from 'react';
import { Play, Info, Sparkles } from 'lucide-react';

export default function Hero({ featuredChannel, onPlay }) {
  if (!featuredChannel) return null;

  return (
    <div className="relative w-full h-[60vh] min-h-[500px] md:h-[75vh] rounded-[2.5rem] overflow-hidden mb-16 group mx-auto border border-white/[0.05] shadow-[0_20px_70px_-15px_rgba(79,70,229,0.3)]">
      {/* Background Image / Placeholder */}
      <div className="absolute inset-0 bg-[#020202]">
        <img 
          src={featuredChannel.logo || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=1920&h=1080"} 
          alt={featuredChannel.name}
          onError={(e) => { 
            e.target.onerror = null; 
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(featuredChannel.name)}&background=1e1b4b&color=c7d2fe&size=512&font-size=0.33`; 
          }}
          className="w-full h-full object-cover transform scale-110 group-hover:scale-105 transition-transform duration-[10s] ease-out opacity-60 mix-blend-screen"
        />
      </div>

      {/* Heavy Cinematic Gradient Overlays */}
      <div className="absolute inset-x-0 bottom-0 top-1/3 bg-gradient-to-t from-[#030305] via-[#030305]/80 to-transparent z-0"></div>
      <div className="absolute inset-y-0 left-0 right-1/4 bg-gradient-to-r from-[#030305] via-[#030305]/60 to-transparent z-0"></div>
      <div className="absolute inset-0 bg-indigo-900/10 mix-blend-overlay z-0"></div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 w-full p-8 md:p-20 flex flex-col justify-end h-full z-10">
        <div className="max-w-4xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-700 ease-out">
          
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass-panel border-indigo-500/30 text-xs md:text-sm font-bold text-white mb-8 shadow-[0_0_20px_rgba(79,70,229,0.4)] animate-pulse">
            <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,1)]"></div>
            <span className="tracking-widest uppercase text-gray-200">En Vivo Ahora</span>
          </div>

          <h1 className="text-5xl md:text-8xl font-black text-white mb-6 tracking-tighter neon-text leading-tight">
            {featuredChannel.name}
          </h1>
          
          <p className="text-gray-300/90 text-lg md:text-2xl font-light mb-10 line-clamp-3 max-w-2xl drop-shadow-md leading-relaxed">
            Sintoniza la transmisión en calidad suprema. Todo el contenido más destacado de la categoría <span className="font-semibold text-white">{featuredChannel.category}</span> en un solo lugar.
          </p>
          
          <div className="flex flex-wrap items-center gap-5">
            <button 
              onClick={() => onPlay(featuredChannel)}
              className="flex items-center justify-center gap-3 px-10 py-5 bg-white text-black rounded-full font-bold text-xl hover:bg-transparent hover:text-white hover:border-white/50 border-2 border-transparent transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(255,255,255,0.6)] transform hover:-translate-y-1"
            >
              <Play className="w-7 h-7 fill-current" />
              SINTONIZAR
            </button>
            
            <button className="flex items-center justify-center gap-3 px-10 py-5 glass-panel text-white rounded-full font-bold text-xl hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-1">
              <Info className="w-7 h-7" />
              Ver Detalles
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
