import React from 'react';
import { Play, Info, Sparkles } from 'lucide-react';

export default function Hero({ featuredChannel, onPlay }) {
  if (!featuredChannel) return null;

  return (
    <div className="relative w-full h-[55vh] min-h-[450px] md:h-[70vh] rounded-[2rem] overflow-hidden mb-12 group shadow-[0_20px_50px_-15px_rgba(79,70,229,0.3)] border border-white/5 mx-2">
      {/* Background Image / Placeholder */}
      <div className="absolute inset-0 bg-black">
        <img 
          src={featuredChannel.logo || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=1920&h=1080"} 
          alt={featuredChannel.name}
          className="w-full h-full object-cover transform scale-105 group-hover:scale-100 transition-transform duration-1000 opacity-50"
        />
      </div>

      {/* Heavy Cinematic Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/60 to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#050508_100%)] opacity-80"></div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 w-full p-6 md:p-16 flex flex-col justify-end h-full z-10">
        <div className="max-w-3xl transform translate-y-2 group-hover:translate-y-0 transition-transform duration-700">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-600/20 backdrop-blur-md border border-indigo-500/30 text-sm font-bold text-indigo-300 mb-6 shadow-[0_0_15px_rgba(79,70,229,0.5)]">
            <Sparkles className="w-4 h-4" />
            <span>EN VIVO AHORA</span>
          </div>

          <h1 className="text-4xl md:text-7xl font-black text-white mb-4 tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
            {featuredChannel.name}
          </h1>
          
          <p className="text-gray-300 text-lg md:text-xl font-medium mb-8 line-clamp-2 max-w-2xl drop-shadow-md">
            Sintoniza la transmisión maestra en calidad suprema. Todo el contenido de la categoría {featuredChannel.category} sin interrupciones.
          </p>
          
          <div className="flex flex-wrap items-center gap-4">
            <button 
              onClick={() => onPlay(featuredChannel)}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-white text-black rounded-full font-black text-lg hover:bg-indigo-500 hover:text-white transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.4)] hover:shadow-[0_0_40px_rgba(79,70,229,0.8)] hover:scale-105"
            >
              <Play className="w-6 h-6 fill-current" />
              SINTONIZAR
            </button>
            
            <button className="flex items-center justify-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-full font-bold text-lg hover:bg-white/20 hover:scale-105 transition-all duration-300 hidden sm:flex">
              <Info className="w-6 h-6" />
              Ver Detalles
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
