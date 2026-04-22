import React from 'react';
import { Play } from 'lucide-react';

export default function ChannelCard({ channel, onPlay }) {
  const displayName = channel.displayName || channel.name;
  
  return (
    <div 
      className="group relative flex flex-col gap-2 cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-95"
      onClick={() => onPlay(channel)}
    >
      {/* Poster Image Container - More compact and "Centered" look */}
      <div className="relative aspect-video sm:aspect-square md:aspect-[4/5] rounded-xl overflow-hidden bg-white/[0.03] border border-white/5 group-hover:border-white/20 transition-all duration-500 p-3 md:p-6">
        <div className="w-full h-full relative flex items-center justify-center">
          <img 
            src={channel.logo} 
            alt={displayName} 
            className="max-w-full max-h-full object-contain transition-all duration-700 group-hover:scale-110"
            onError={(e) => { 
              e.target.onerror = null; 
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=111111&color=ffffff&size=512&font-size=0.33&bold=true`; 
            }}
            loading="lazy"
          />
        </div>
        
        {/* Minimal Play Icon */}
        <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 bg-black/40">
           <div className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
              <Play className="w-5 h-5 fill-current" />
           </div>
        </div>
      </div>

      {/* Info Below */}
      <div className="px-1 text-center md:text-left">
        <h3 className="font-bold text-white text-[10px] md:text-[12px] tracking-tight leading-tight line-clamp-1 opacity-70 group-hover:opacity-100 transition-opacity">
          {displayName}
        </h3>
        <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest mt-0.5">
           {channel.category}
        </p>
      </div>
    </div>
  );
}
