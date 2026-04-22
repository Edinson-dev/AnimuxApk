import React from 'react';
import { Heart, Play } from 'lucide-react';

export default function ChannelCard({ channel, isFavorite, toggleFavorite, onPlay }) {
  return (
    <div 
      className="group relative rounded-2xl overflow-hidden cursor-pointer flex flex-col justify-end transition-all duration-500 hover:-translate-y-2 glass-card aspect-video border border-white/[0.05]"
      onClick={() => onPlay(channel)}
    >
      
      {/* Thumbnail/Logo Area */}
      <div className="absolute inset-0 p-6 md:p-8 flex items-center justify-center bg-white/[0.02] transition-colors duration-500 group-hover:bg-indigo-900/10">
        <img 
          src={channel.logo} 
          alt={channel.name} 
          className="max-w-[70%] max-h-[70%] object-contain filter drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] group-hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all duration-500 group-hover:scale-110"
          onError={(e) => { 
            e.target.onerror = null; 
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.name)}&background=1e1b4b&color=c7d2fe&size=512&font-size=0.33`; 
          }}
          loading="lazy"
        />
      </div>

      {/* Dark gradient overlay for text */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-500"></div>

      {/* Play Button Overlay (Center) */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-20">
        <div className="bg-indigo-500 text-white rounded-full p-4 transform scale-50 group-hover:scale-100 transition-transform duration-500 shadow-[0_0_30px_rgba(99,102,241,0.6)]">
          <Play className="w-8 h-8 fill-current translate-x-0.5" />
        </div>
      </div>

      {/* Top Right Live Dot & Category Label */}
      <div className="absolute top-3 right-3 z-20 flex gap-2 items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform -translate-y-2 group-hover:translate-y-0">
         <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest text-gray-300 border border-white/10">
            {channel.category ? channel.category.split(';')[0].trim() : 'TV'}
         </span>
      </div>

      {/* Info Area Bottom */}
      <div className="relative p-4 md:p-5 z-10 w-full transition-all duration-500">
        <div className="flex justify-between items-end gap-3">
          <div className="flex-1 overflow-hidden transform group-hover:-translate-y-1 transition-transform duration-300">
            <h3 className="font-bold text-white text-base md:text-lg truncate group-hover:text-indigo-300 transition-colors tracking-tight">{channel.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse"></span>
              <span className="text-gray-400 text-xs font-medium truncate">Transmisión Activa</span>
            </div>
          </div>
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(channel.id);
            }}
            className="p-2.5 rounded-full bg-black/40 hover:bg-white/10 transition-colors z-30 border border-white/10 group-hover:border-indigo-500/30 transform hover:scale-110 active:scale-90"
          >
            <Heart 
              className={`w-5 h-5 transition-colors ${isFavorite ? 'text-pink-500 fill-pink-500 filter drop-shadow-[0_0_12px_rgba(236,72,153,0.8)]' : 'text-gray-400'}`} 
            />
          </button>
        </div>
      </div>
    </div>
  );
}
