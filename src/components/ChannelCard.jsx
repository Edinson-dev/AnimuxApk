import React from 'react';
import { Heart, Play, Star } from 'lucide-react';

export default function ChannelCard({ channel, isFavorite, toggleFavorite, onPlay }) {
  const isVOD = channel.isVOD;
  const displayName = channel.displayName || channel.name;
  
  return (
    <div 
      className={`group relative rounded-[2rem] md:rounded-[2.5rem] overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.6)] glass-card animate-fade-in ${channel.isVOD ? 'aspect-[2/3]' : 'aspect-video'} border-white/[0.03] hover:border-indigo-500/40`}
      onClick={() => onPlay(channel)}
    >
      
      {/* Poster Background */}
      <div className="absolute inset-0 z-0 bg-[#0a0a0f]">
        <img 
          src={channel.logo} 
          alt={displayName} 
          className={`w-full h-full transition-all duration-700 group-hover:scale-105 ${channel.isVOD ? 'object-cover' : 'object-contain p-4 md:p-8'}`}
          onError={(e) => { 
            e.target.onerror = null; 
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1e1b4b&color=c7d2fe&size=512&font-size=0.33`; 
          }}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060608] via-[#060608]/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
      </div>

      {/* Badges Overlay */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5">
        <div className="flex gap-1.5">
          <span className="bg-indigo-600/90 backdrop-blur-md px-1.5 py-0.5 rounded-lg text-[7px] md:text-[8px] font-black uppercase tracking-widest text-white shadow-lg">HD</span>
          {channel.isVOD && (
             <span className="bg-emerald-500/90 backdrop-blur-md px-1.5 py-0.5 rounded-lg text-[7px] md:text-[8px] font-black uppercase tracking-widest text-white shadow-lg">Dual</span>
          )}
        </div>
        {!channel.isVOD && (
          <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/5 w-fit">
            <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]"></span>
            <span className="text-[6px] md:text-[7px] font-black text-white uppercase tracking-widest">LIVE</span>
          </div>
        )}
      </div>

      {/* Center Play Icon */}
      <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
         <div className="w-10 h-10 md:w-12 md:h-12 bg-white text-black rounded-full flex items-center justify-center shadow-2xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-5 h-5 md:w-6 md:h-6 fill-current ml-1" />
         </div>
      </div>

      {/* Bottom Content Area */}
      <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 z-20">
        <div className="space-y-0.5">
          <h3 className="font-bold text-white text-[10px] md:text-sm tracking-tight leading-tight line-clamp-1 group-hover:text-indigo-400 transition-colors">
            {displayName}
          </h3>
          <div className="flex items-center gap-1.5">
            <span className="text-[7px] md:text-[9px] text-gray-400 font-bold uppercase tracking-tighter truncate max-w-[80%]">
              {channel.category || 'General'}
            </span>
          </div>
        </div>
      </div>

      {/* Gloss Effect */}
      <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-10 bg-gradient-to-tr from-white/20 via-transparent to-transparent pointer-events-none"></div>
    </div>
  );
}
