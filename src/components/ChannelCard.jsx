import React from 'react';
import { Play } from 'lucide-react';

export default function ChannelCard({ channel, onPlay }) {
  const displayName = channel.displayName || channel.name;
  
  return (
    <div 
      className="group relative flex flex-col gap-3 cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-95"
      onClick={() => onPlay(channel)}
    >
      {/* Poster Image Container - HBO Style (Sharp corners, clean border) */}
      <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-[#111111] border border-white/[0.03] transition-all duration-500 group-hover:border-white/20">
        <img 
          src={channel.logo} 
          alt={displayName} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
          onError={(e) => { 
            e.target.onerror = null; 
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=111111&color=ffffff&size=512&font-size=0.33&bold=true`; 
          }}
          loading="lazy"
        />
        
        {/* Play Icon Overlay - HBO Style (Minimalist) */}
        <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 bg-black/40 backdrop-blur-[1px]">
           <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 transform scale-75 group-hover:scale-100 transition-all duration-500">
              <Play className="w-5 h-5 text-white fill-current" />
           </div>
        </div>

        {/* Ambient Gradient Bottom */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </div>

      {/* Title Below Image - HBO Style (Clean, Bold, High Contrast) */}
      <div className="px-1 space-y-1">
        <h3 className="font-bold text-white text-[12px] md:text-[14px] tracking-tight leading-tight line-clamp-1 transition-colors duration-300">
          {displayName}
        </h3>
        <div className="flex items-center gap-2">
           <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em]">
             {channel.category || 'Animux'}
           </span>
        </div>
      </div>
    </div>
  );
}
