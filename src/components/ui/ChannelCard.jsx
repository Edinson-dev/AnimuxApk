import React from 'react';
import { Play, Heart, Film, Tv } from 'lucide-react';

export default function ChannelCard({ channel, onPlay, isFavorite, onToggleFavorite }) {
  if (!channel) return null;

  const isVOD = channel.isVOD === true;

  // Obtenemos un nombre corto para la etiqueta (badge)
  const badgeText = isVOD 
    ? (channel.category || 'FILM').toUpperCase() 
    : 'LIVE';

  return (
    <div 
      className="group relative flex flex-col gap-2 cursor-pointer animate-scale-in"
      onClick={() => onPlay(channel)}
    >
      <div className={`relative overflow-hidden rounded-xl bg-[#0a0a0a] border border-white/5 transition-all duration-500 group-hover:border-rose-600/50 group-hover:shadow-[0_0_30px_rgba(225,29,72,0.2)] aspect-[2/3]`}>
        <img 
          src={channel.logo || channel.poster} 
          alt={channel.name || channel.title} 
          className={`w-full h-full transition-transform duration-700 group-hover:scale-110 ${isVOD ? 'object-cover' : 'object-contain p-4'}`}
          loading="lazy"
        />
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center backdrop-blur-[2px]">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-rose-600 rounded-full flex items-center justify-center shadow-2xl scale-50 group-hover:scale-100 transition-transform duration-500 shadow-rose-600/50">
            <Play className="w-6 h-6 md:w-8 md:h-8 text-white fill-current ml-1" />
          </div>
        </div>

        {/* Quality/Type Badge (DINÁMICO) */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          <span className={`px-2 py-0.5 backdrop-blur-md border border-white/10 rounded text-[8px] font-black text-white uppercase tracking-widest shadow-lg ${isVOD ? 'bg-black/60' : 'bg-rose-600/80 animate-pulse'}`}>
            {badgeText}
          </span>
          {channel.isNew && (
            <span className="px-2 py-0.5 bg-green-500/90 backdrop-blur-md border border-green-400/30 rounded text-[7px] font-black text-white uppercase tracking-tighter shadow-lg animate-bounce">
              Nuevo
            </span>
          )}
        </div>

        {/* Favorite Button */}
        {onToggleFavorite && (
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(channel.id); }}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md border transition-all ${isFavorite ? 'bg-rose-600 border-rose-600 text-white' : 'bg-black/40 border-white/10 text-white/70 hover:text-white hover:bg-black/60'}`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>

      <div className="px-1 py-1">
        <h4 className="text-[11px] md:text-sm font-black text-white/90 truncate uppercase tracking-tight group-hover:text-rose-500 transition-colors">
          {channel.displayName || channel.title || channel.name}
        </h4>
        <div className="flex items-center gap-2 mt-0.5 opacity-40">
           {isVOD ? <Film className="w-3 h-3 text-gray-400" /> : <Tv className="w-3 h-3 text-gray-400" />}
           <p className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{channel.category}</p>
        </div>
      </div>
    </div>
  );
}
