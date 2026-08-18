import React, { memo, useState, useCallback, useRef } from 'react';
import { Play, Heart, Film, Tv, Eye } from 'lucide-react';

const ChannelCard = memo(function ChannelCard({ channel, onPlay, isFavorite, onToggleFavorite }) {
  if (!channel) return null;

  const [imgError, setImgError] = useState(false);
  const [progress, setProgress] = useState(null);

  const isVOD = channel.isVOD === true;

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

  return (
    <div 
      tabIndex={0}
      className="group relative flex flex-col gap-2 cursor-pointer transition-transform duration-200 ease-out hover:-translate-y-0.5 active:scale-95 focus:outline-none focus:ring-4 focus:ring-rose-500/80 rounded-2xl will-change-transform ripple-touch"
      onClick={handlePlay}
      onKeyDown={handleKeyDown}
      style={{ contain: 'layout style paint' }}
    >
      <div className={`relative overflow-hidden rounded-2xl bg-[#0a0a0a] border border-white/5 transition-colors duration-200 group-hover:border-rose-500/30 ${isVOD ? 'aspect-[2/3]' : 'aspect-video'}`}>
        {/* Fondo oscuro base optimizado */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800/20 to-black/80 z-0" />
        
        {imgError ? (
          <div className="relative z-10 w-full h-full flex items-center justify-center bg-[#111]">
            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest text-center px-2 line-clamp-2">{displayName}</span>
          </div>
        ) : (
          <img 
            src={channel.logo || channel.poster} 
            alt={displayName} 
            className={`relative z-10 w-full h-full shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] ${isVOD ? 'object-cover' : 'object-contain p-2 md:p-3'}`}
            loading="lazy"
            decoding="async"
            onError={handleImgError}
          />
        )}
        
        {/* Hover Overlay (Solo visible en hover/desktop) */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-rose-600 rounded-full flex items-center justify-center shadow-2xl scale-50 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-6 h-6 md:w-8 md:h-8 text-white fill-current ml-1" />
          </div>
        </div>

        {/* Progress Bar (Solo VOD) */}
        {isVOD && progress && progress.percent > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-black/60 z-20 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-rose-600 to-rose-400 progress-glow transition-all duration-300" 
              style={{ width: `${progress.percent}%` }} 
            />
          </div>
        )}

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
            ref={favBtnRef}
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              // Trigger heart burst
              if (favBtnRef.current) {
                favBtnRef.current.classList.remove('heart-burst');
                void favBtnRef.current.offsetWidth; // force reflow
                favBtnRef.current.classList.add('heart-burst');
              }
              onToggleFavorite(channel.id);
            }}
            onKeyDown={handleFavKey}
            className={`absolute top-3 right-3 p-2 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-white ${isFavorite ? 'bg-rose-600 border-rose-600 text-white' : 'bg-black/60 border-white/10 text-white/70'}`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>

      <div className="px-1 py-1">
        <h4 className="text-[11px] md:text-sm font-black text-white/90 truncate uppercase tracking-tight transition-colors duration-300 group-hover:text-rose-400">
          {displayName}
        </h4>
        <div className="flex items-center gap-2 mt-0.5 opacity-50">
           <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: getCatColor() }} />
           {isVOD ? <Film className="w-3 h-3 text-gray-400" /> : <Tv className="w-3 h-3 text-gray-400" />}
           <p className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
             {(channel.category || '').toLowerCase().includes('documentary') ? 'Documentales' : 
              (channel.category || '').toLowerCase().includes('religious') ? 'Religioso' : 
              channel.category}
           </p>
           {!isVOD && viewerCount > 0 && (
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
