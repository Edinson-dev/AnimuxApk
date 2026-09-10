import React, { memo, useState, useCallback, useRef } from 'react';
import { Play, Heart, Film, Tv, Eye } from 'lucide-react';
import { getItemYear } from '../../utils/filters';

const ChannelCard = memo(function ChannelCard({ channel, onPlay, isFavorite, onToggleFavorite }) {
  const [imgError, setImgError] = useState(false);
  const [progress, setProgress] = useState(null);

  const isVOD = channel?.isVOD === true;

  // Cargar progreso y escuchar actualizaciones
  React.useEffect(() => {
    const checkProgress = () => {
      if (isVOD) {
        let targetId = channel.id;
        if (channel.isGroupRepresentative && channel.groupId) {
          const lastEpisodeId = localStorage.getItem(`animux_last_episode_${channel.groupId}`);
          if (lastEpisodeId) targetId = lastEpisodeId;
        }

        const saved = localStorage.getItem(`animux_progress_${targetId}`);
        if (saved) {
          try {
            setProgress(JSON.parse(saved));
          } catch (e) {}
        } else {
          setProgress(null);
        }
      }
    };

    checkProgress();

    // Escuchar actualizaciones globales de progreso
    const handleUpdate = (e) => {
      const { channelId } = e.detail;
      // Si el ID coincide o si es una serie y el ID podría ser de un episodio de esta serie
      // (Para simplificar, re-comprobamos siempre que sea VOD y ocurra un evento)
      if (isVOD) checkProgress();
    };

    window.addEventListener('animux_progress_updated', handleUpdate);
    return () => window.removeEventListener('animux_progress_updated', handleUpdate);
  }, [channel.id, channel.groupId, channel.isGroupRepresentative, isVOD]);

  // Obtenemos un nombre corto para la etiqueta (badge)
  const badgeText = isVOD 
    ? (channel.isGroupRepresentative ? 'SERIE VOD' : (channel.category || 'FILM').toUpperCase()) 
    : 'LIVE';

  const displayName = channel.displayName || channel.title || channel.name;

  const handlePlay = useCallback(() => onPlay(channel), [onPlay, channel]);
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') { e.preventDefault(); onPlay(channel); }
  }, [onPlay, channel]);
  const handleToggleFav = useCallback((e) => {
    e.stopPropagation(); onToggleFavorite(channel.id);
  }, [onToggleFavorite, channel.id]);
  const handleFavKey = useCallback((e) => {
    if (e.key === 'Enter') { e.stopPropagation(); onToggleFavorite(channel.id); }
  }, [onToggleFavorite, channel.id]);
  const handleImgError = useCallback(() => setImgError(true), []);
  const favBtnRef = useRef(null);

  // Deterministic "viewer count" based on channel id (stable, no re-renders)
  const viewerCount = !isVOD ? ((channel.id?.toString().split('').reduce((a, c) => a + c.charCodeAt(0), 0) || 100) % 400) + 50 : 0;

  // Category color helper
  const getCatColor = () => {
    const cat = (channel.category || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (cat.includes('deporte')) return '#22c55e';
    if (cat.includes('infantil') || cat.includes('kids')) return '#facc15';
    if (cat.includes('cine') || cat.includes('pelicul')) return '#e11d48';
    if (cat.includes('musica')) return '#a855f7';
    if (cat.includes('anime')) return '#3b82f6';
    if (cat.includes('serie')) return '#f97316';
    if (cat.includes('noticias') || cat.includes('news')) return '#06b6d4';
    if (cat.includes('document')) return '#14b8a6';
    return '#6b7280';
  };

  if (!channel) return null;

  return (
    <div 
      tabIndex={0}
      className="group relative flex flex-col gap-2 cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-2 focus:ring-rose-500 rounded-2xl will-change-transform select-none"
      onClick={handlePlay}
      onKeyDown={handleKeyDown}
      onFocus={(e) => {
        try {
          e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        } catch {}
      }}
      style={{ contain: 'layout style paint' }}
    >
      <div className={`relative overflow-hidden rounded-2xl bg-[#0c0d12] border border-white/[0.08] transition-all duration-300 group-hover:border-rose-500/40 group-hover:shadow-[0_12px_30px_rgba(225,29,72,0.18)] ${isVOD ? 'aspect-[2/3]' : 'aspect-video'}`}>
        {/* Fondo oscuro base cinematográfico */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20 z-0" />
        
        {imgError ? (
          <div className="relative z-10 w-full h-full flex items-center justify-center bg-[#101118]">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-wider text-center px-2 line-clamp-2">{displayName}</span>
          </div>
        ) : (
          <img 
            src={channel.logo || channel.poster} 
            alt={displayName} 
            className={`relative z-10 w-full h-full transition-transform duration-500 group-hover:scale-105 ${isVOD ? 'object-cover' : 'object-contain p-3 md:p-4'}`}
            loading="lazy"
            decoding="async"
            onError={handleImgError}
          />
        )}
        
        {/* Hover Overlay con Botón Play Cinemático */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-15">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-tr from-rose-600 to-rose-500 rounded-full flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-300 border border-white/20">
            <Play className="w-5 h-5 md:w-6 md:h-6 text-white fill-current ml-0.5" />
          </div>
        </div>

        {/* Progress Bar (Solo VOD) */}
        {isVOD && progress && progress.percent > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-black/80 z-20 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_8px_rgba(244,63,94,1)] transition-all duration-300" 
              style={{ width: `${progress.percent}%` }} 
            />
          </div>
        )}

        {/* Quality/Type Badge — Píldoras translúcidas OLED */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-20 pointer-events-none">
          <div className={`px-2 py-0.5 rounded-md flex items-center gap-1.5 backdrop-blur-md border ${
            !isVOD 
              ? 'bg-rose-600/90 border-rose-400/30 text-white shadow-md shadow-rose-900/40' 
              : 'bg-black/70 border-white/15 text-white/90 shadow-md'
          }`}>
            {!isVOD && (
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            )}
            <span className="text-[7.5px] font-black uppercase tracking-wider">
              {badgeText}
            </span>
          </div>
          
          {channel.isNew && (
            <span className="px-2 py-0.5 bg-amber-500/90 text-black font-black rounded-md text-[7px] uppercase tracking-tighter shadow-md">
              TOP
            </span>
          )}
        </div>

        {/* Favorite Button */}
        {onToggleFavorite && (
          <button 
            ref={favBtnRef}
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              if (favBtnRef.current) {
                favBtnRef.current.classList.remove('heart-burst');
                void favBtnRef.current.offsetWidth;
                favBtnRef.current.classList.add('heart-burst');
              }
              onToggleFavorite(channel.id);
            }}
            onKeyDown={handleFavKey}
            className={`absolute top-2 right-2 p-1.5 md:p-2 rounded-full border backdrop-blur-md transition-all active:scale-90 z-20 ${
              isFavorite 
                ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/40' 
                : 'bg-black/50 border-white/10 text-white/60 hover:text-white hover:bg-black/70'
            }`}
          >
            <Heart className={`w-3 h-3 md:w-3.5 md:h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>

      <div className="px-1 py-1">
        <h4 className="text-[11px] md:text-sm font-black text-white/90 truncate uppercase tracking-tight transition-colors duration-300 group-hover:text-rose-400">
          {displayName}
        </h4>
        <div className="flex items-center gap-1.5 mt-0.5 opacity-60 flex-wrap">
           <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: getCatColor() }} />
           {isVOD ? <Film className="w-3 h-3 text-gray-400 shrink-0" /> : <Tv className="w-3 h-3 text-gray-400 shrink-0" />}
           <p className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate max-w-[85px] md:max-w-[110px]">
             {(channel.category || '').toLowerCase().includes('documentary') ? 'Documentales' : 
              (channel.category || '').toLowerCase().includes('religious') ? 'Religioso' : 
              channel.category}
           </p>
           {getItemYear(channel) && (
             <span className="text-[8px] md:text-[9px] font-bold text-gray-400 shrink-0">
               • {getItemYear(channel)}
             </span>
           )}
           {channel.rating && Number(channel.rating) > 0 && (
             <span className="flex items-center text-[8px] md:text-[9px] font-black text-amber-400 shrink-0 ml-auto">
               ⭐ {Number(channel.rating).toFixed(1)}
             </span>
           )}
           {!isVOD && viewerCount > 0 && (!channel.rating || Number(channel.rating) <= 0) && (
             <span className="flex items-center gap-0.5 text-[7px] font-black text-green-500/70 ml-auto shrink-0">
               <Eye className="w-2.5 h-2.5" />
               {viewerCount}
             </span>
           )}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparator: only re-render if these specific props changed
  return (
    prevProps.channel?.id === nextProps.channel?.id &&
    prevProps.isFavorite === nextProps.isFavorite &&
    prevProps.onPlay === nextProps.onPlay &&
    prevProps.onToggleFavorite === nextProps.onToggleFavorite
  );
});

export default ChannelCard;
