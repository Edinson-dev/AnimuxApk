import React from 'react';
import { Play, Info } from 'lucide-react';

export default function Hero({ featuredChannel, onPlay }) {
  if (!featuredChannel) return null;

  return (
    <div className="relative w-full h-[60vh] min-h-[400px] mb-12 rounded-3xl overflow-hidden group">
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0">
        <img 
          src={featuredChannel.logo} 
          alt={featuredChannel.name} 
          className="w-full h-full object-cover object-center scale-105 group-hover:scale-110 transition-transform duration-700 opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full md:w-2/3 z-10 flex flex-col items-start">
        <span className="px-3 py-1 bg-primary/80 backdrop-blur-md rounded-full text-xs font-bold tracking-wider mb-4 animate-fade-in text-white shadow-lg shadow-primary/30">
          DESTACADO
        </span>
        <h1 className="text-4xl md:text-6xl font-black text-white mb-4 drop-shadow-2xl">
          {featuredChannel.name}
        </h1>
        <p className="text-gray-300 text-lg mb-8 max-w-xl line-clamp-3 overflow-hidden text-ellipsis">
          Disfruta de la mejor programación de {featuredChannel.category} en vivo. 
          Sintoniza ahora para ver tus animes y series favoritas sin interrupciones.
        </p>

        <div className="flex gap-4">
          <button 
            onClick={() => onPlay(featuredChannel)}
            className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            <Play fill="currentColor" size={20} />
            Reproducir
          </button>
          <button 
            className="flex items-center gap-2 bg-white/10 backdrop-blur-lg border border-white/20 text-white px-8 py-3 rounded-full font-bold hover:bg-white/20 hover:scale-105 transition-all duration-300"
          >
            <Info size={20} />
            Más Info
          </button>
        </div>
      </div>
    </div>
  );
}
