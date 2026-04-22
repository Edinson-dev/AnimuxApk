import React from 'react';
import { Heart, Play, Star } from 'lucide-react';

export default function ChannelCard({ channel, isFavorite, toggleFavorite, onPlay }) {
  const isVOD = channel.isVOD;
  const displayName = channel.displayName || channel.name;
  
  return (
    <div 
      className={`group relative rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-700 hover:-translate-y-3 hover:shadow-[0_20px_50px_rgba(79,70,229,0.3)] glass-card animate-fade-in ${channel.isVOD ? 'aspect-[2/3]' : 'aspect-video'} border-white/5 hover:border-indigo-500/50`}
      onClick={() => onPlay(channel)}
    >
      
      {/* Poster Background */}
      <div className="absolute inset-0 z-0 bg-[#12121e]">
        <img 
          src={channel.logo} 
          alt={displayName} 
          className={`w-full h-full transition-all duration-700 group-hover:scale-110 ${channel.isVOD ? 'object-cover' : 'object-contain p-6 md:p-8'}`}
          onError={(e) => { 
            e.target.onerror = null; 
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1e1b4b&color=c7d2fe&size=512&font-size=0.33`; 
          }}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060608] via-transparent to-transparent opacity-90 group-hover:opacity-100 transition-opacity"></div>
      </div>

      {/* Badges Overlay */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-2">
        <div className="flex gap-2">
          <span className="bg-indigo-600 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-500/30">HD</span>
          {channel.isVOD && (
             <span className="bg-green-500/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest text-white shadow-lg">Dual</span>
          )}
        </div>
        {!channel.isVOD && (
          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]"></span>
            <span className="text-[7px] font-black text-white uppercase tracking-widest">EN VIVO</span>
          </div>
        )}
      </div>

      <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(channel.id);
          }}
          className="p-2 rounded-xl bg-black/60 backdrop-blur-md hover:bg-rose-600 transition-all border border-white/10 shadow-xl"
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'text-white fill-current' : 'text-white/60'}`} />
        </button>
      </div>

      {/* Play Icon Placeholder (Centered) */}
      <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
         <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.4)] transform scale-50 group-hover:scale-100 transition-transform duration-500">
            <Play className="w-6 h-6 fill-current" />
         </div>
      </div>

      {/* Bottom Content Area */}
      <div className="absolute bottom-0 left-0 right-0 p-3 z-20 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
        <div className="space-y-0.5">
          <h3 className="font-bold text-white text-[11px] md:text-sm tracking-tight leading-tight line-clamp-1 group-hover:text-indigo-400 transition-colors">
            {displayName}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-gray-400 font-medium">2024</span>
            <span className="w-1 h-1 rounded-full bg-gray-600"></span>
            <span className="text-[8px] text-gray-400 uppercase font-black tracking-widest truncate">
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
