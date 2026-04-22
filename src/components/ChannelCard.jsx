import React from 'react';
import { Heart, Play, Star } from 'lucide-react';

export default function ChannelCard({ channel, isFavorite, toggleFavorite, onPlay }) {
  const isVOD = channel.isVOD;
  const displayName = channel.displayName || channel.name;
  
  return (
    <div 
      className="group relative flex flex-col gap-2 cursor-pointer transition-all duration-300 active:scale-95"
      onClick={() => onPlay(channel)}
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-[#0a0a0f] border border-white/5">
        <img 
          src={channel.logo} 
          alt={displayName} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { 
            e.target.onerror = null; 
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1e1b4b&color=c7d2fe&size=512&font-size=0.33`; 
          }}
          loading="lazy"
        />
        
        {/* Rating Badge (Top Left) */}
        <div className="absolute top-1.5 left-1.5 z-10">
           <div className="bg-indigo-600 px-1 py-0.5 rounded text-[8px] font-black text-white shadow-lg">
             7.4
           </div>
        </div>

        {/* Center Play Icon Overlay */}
        <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/20">
           <div className="w-10 h-10 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center border border-white/30">
              <Play className="w-5 h-5 fill-current ml-0.5" />
           </div>
        </div>
      </div>

      {/* Title Below Image */}
      <div className="px-1">
        <h3 className="font-bold text-white text-[11px] md:text-sm tracking-tight leading-tight line-clamp-1 group-hover:text-indigo-400 transition-colors">
          {displayName}
        </h3>
        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
          {channel.category || 'General'}
        </p>
      </div>

      {/* Gloss Effect */}
      <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-10 bg-gradient-to-tr from-white/20 via-transparent to-transparent pointer-events-none"></div>
    </div>
  );
}
