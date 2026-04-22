import React from 'react';
import { Heart, Play, Star } from 'lucide-react';

export default function ChannelCard({ channel, isFavorite, toggleFavorite, onPlay }) {
  const isVOD = channel.isVOD;
  const displayName = channel.displayName || channel.name;
  
  return (
    <div 
      className="group relative flex flex-col gap-3 cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-95"
      onClick={() => onPlay(channel)}
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#0d0d0f] border border-white/5 shadow-lg group-hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] group-hover:border-indigo-500/50 transition-all duration-500">
        <img 
          src={channel.logo} 
          alt={displayName} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => { 
            e.target.onerror = null; 
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1e1b4b&color=c7d2fe&size=512&font-size=0.33`; 
          }}
          loading="lazy"
        />
        
        {/* Rating Badge (Top Left) */}
        <div className="absolute top-2 left-2 z-10 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
           <div className="bg-indigo-600 px-2 py-1 rounded-lg text-[9px] font-black text-white shadow-xl flex items-center gap-1">
             <Star className="w-2.5 h-2.5 fill-current" /> 7.4
           </div>
        </div>

        {/* Play Icon Overlay */}
        <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 bg-black/40 backdrop-blur-[2px]">
           <div className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-2xl transform scale-50 group-hover:scale-100 transition-all duration-500">
              <Play className="w-6 h-6 fill-current ml-1" />
           </div>
        </div>
      </div>

      {/* Title Below Image */}
      <div className="px-1 space-y-1">
        <h3 className="font-bold text-white text-xs md:text-[13px] tracking-tight leading-tight line-clamp-1 group-hover:text-indigo-400 transition-colors duration-300">
          {displayName}
        </h3>
        <div className="flex items-center gap-2">
           <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest px-1.5 py-0.5 bg-white/5 rounded">
             {channel.category || 'Varios'}
           </span>
        </div>
      </div>
    </div>
  );
}
