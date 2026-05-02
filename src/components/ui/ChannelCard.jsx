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
      tabIndex={0}
      className="group relative flex flex-col gap-2 cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-4 focus:ring-rose-500/80 focus:scale-[1.05] rounded-2xl"
      onClick={() => onPlay(channel)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onPlay(channel);
        }
      }}
    >
      <div className={`relative overflow-hidden rounded-2xl bg-[#0a0a0a] border border-white/5 transition-all duration-300 ease-out group-hover:border-rose-500/30 shadow-md group-hover:shadow-[0_8px_30px_rgba(225,29,72,0.3)] ${isVOD ? 'aspect-[2/3]' : 'aspect-video'}`}>
        {/* Fondo oscuro base optimizado (reemplaza el costoso blur-xl) */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800/20 to-black/80 z-0" />
        
        <img 
          src={channel.logo || channel.poster} 
          alt={channel.name || channel.title} 
          className={`relative z-10 w-full h-full shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] ${isVOD ? 'object-cover' : 'object-contain p-2 md:p-3'}`}
          loading="lazy"
        />
        
        {/* Hover Overlay (Solo visible en hover/desktop) */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-rose-600 rounded-full flex items-center justify-center shadow-2xl scale-50 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-6 h-6 md:w-8 md:h-8 text-white fill-current ml-1" />
          </div>
        </div>

        {/* Quality/Type Badge */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-20">
          <div className={`px-2 py-0.5 rounded-md flex items-center gap-1.5 badge-premium ${isVOD ? '' : 'bg-rose-600/80'}`}>
            {!isVOD && (
              <div className="flex items-center gap-0.5 h-2">
                {/* Glow estático para reemplazar el pesado animate-pulse */}
                <div className="w-[2px] h-2 bg-white/90 rounded-full shadow-[0_0_6px_rgba(255,255,255,0.9)]" />
              </div>
            )}
            <span className="text-[7px] font-black text-white uppercase tracking-widest">
              {badgeText}
            </span>
          </div>
          
          {channel.isNew && (
            <span className="px-2 py-0.5 text-white rounded-md text-[7px] font-black uppercase tracking-tighter top-10-badge">
              TOP 10
            </span>
          )}
        </div>

        {/* Favorite Button */}
        {onToggleFavorite && (
          <button 
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(channel.id); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.stopPropagation();
                onToggleFavorite(channel.id);
              }
            }}
            className={`absolute top-3 right-3 p-2 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-white ${isFavorite ? 'bg-rose-600 border-rose-600 text-white' : 'bg-black/60 border-white/10 text-white/70'}`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>

      <div className="px-1 py-1">
        <h4 className="text-[11px] md:text-sm font-black text-white/90 truncate uppercase tracking-tight transition-all duration-300 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-rose-400">
          {channel.displayName || channel.title || channel.name}
        </h4>
        <div className="flex items-center gap-2 mt-0.5 opacity-40">
           {isVOD ? <Film className="w-3 h-3 text-gray-400" /> : <Tv className="w-3 h-3 text-gray-400" />}
           <p className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
             {(channel.category || '').toLowerCase().includes('documentary') ? 'Documentales' : 
              (channel.category || '').toLowerCase().includes('religious') ? 'Religioso' : 
              channel.category}
           </p>
        </div>
      </div>
    </div>
  );
}
