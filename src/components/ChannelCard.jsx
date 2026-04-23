import React from 'react';
import { Play, Heart, Film, Tv } from 'lucide-react';

export default function ChannelCard({ channel, onPlay, isFavorite, onToggleFavorite }) {
  if (!channel) return null;

  const isVOD = channel.isVOD || channel.category?.includes('Cine') || channel.category?.includes('Filmes');

  return (
    <div 
      className="group relative flex flex-col gap-2 cursor-pointer animate-scale-in"
      onClick={() => onPlay(channel)}
    >
      {/* Container - Fixed to aspect-video (16:9) for UNIFORMITY */}
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-[#0a0a0a] border border-white/5 transition-all duration-500 group-hover:border-rose-600/50 group-hover:shadow-[0_0_30px_rgba(225,29,72,0.2)]">
        <img 
          src={channel.logo || channel.poster} 
          alt={channel.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center backdrop-blur-[2px]">
          <div className="w-12 h-12 bg-rose-600 rounded-full flex items-center justify-center shadow-2xl scale-50 group-hover:scale-100 transition-transform duration-500 shadow-rose-600/50">
            <Play className="w-5 h-5 text-white fill-current ml-1" />
          </div>
        </div>

        {/* Quality/Type Badge */}
        <div className="absolute top-2 left-2 flex gap-2">
          {isVOD ? (
            <span className="px-1.5 py-0.5 bg-black/60 backdrop-blur-md border border-white/10 rounded text-[7px] font-black text-white uppercase tracking-widest">FILM</span>
          ) : (
            <span className="px-1.5 py-0.5 bg-rose-600/80 backdrop-blur-md rounded text-[7px] font-black text-white uppercase tracking-widest animate-pulse">LIVE</span>
          )}
        </div>

        {/* Favorite Button */}
        {onToggleFavorite && (
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(channel.id); }}
            className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md border transition-all ${isFavorite ? 'bg-rose-600 border-rose-600 text-white' : 'bg-black/40 border-white/10 text-white/70 hover:text-white hover:bg-black/60'}`}
          >
            <Heart className={`w-3 h-3 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>

      {/* Info Section - Always centered like others */}
      <div className="px-1 py-1 text-center">
        <h4 className="text-[10px] md:text-[12px] font-black text-white/90 truncate uppercase tracking-tighter group-hover:text-rose-500 transition-colors leading-tight">
          {channel.displayName || channel.name}
        </h4>
        <div className="flex items-center justify-center gap-1.5 mt-0.5 opacity-40">
           {isVOD ? <Film className="w-2.5 h-2.5 text-gray-400" /> : <Tv className="w-2.5 h-2.5 text-gray-400" />}
           <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest truncate max-w-[80px]">{channel.category}</p>
        </div>
      </div>
    </div>
  );
}
