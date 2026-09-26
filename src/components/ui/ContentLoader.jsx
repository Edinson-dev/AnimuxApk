import React, { useState, useEffect } from 'react';
import { Film, Tv, Radio, Trophy } from 'lucide-react';

export default function ContentLoader({ channel, className = "w-16 h-16" }) {
  const catLower = (channel?.category || '').toLowerCase();
  const nameLower = (channel?.name || channel?.displayName || '').toLowerCase();

  const isPodcast = channel?.isPodcast || catLower === 'podcasts' || catLower === 'podcast';
  const isVOD = channel?.isVOD === true || /pelicula|película|cine|series|movie|film|vod|estreno/i.test(catLower);
  const isSeries = isVOD && (!!channel?.groupId || /serie|season|temporada|episodio/i.test(catLower));
  const isMovie = isVOD && !isSeries;
  const isSports = /deportes|sports|futbol|fútbol|mundial|fifa|espn|fox sports|dsports|directv sports|tnt sports|champions|liga|copa|lucha|wwe|ufc|nba|f1|formula 1|beisbol|béisbol/i.test(catLower) ||
                   /futbol|fútbol|mundial|fifa|match|vs|partido/i.test(nameLower);

  const [stepIndex, setStepIndex] = useState(0);

  const steps = isMovie
    ? ['Conectando señal...', 'Cargando reproducción...', 'Iniciando película...']
    : isSeries
    ? ['Conectando episodio...', 'Cargando reproducción...', 'Iniciando serie...']
    : isSports
    ? ['Sintonizando transmisión...', 'Estabilizando señal...', 'Iniciando en vivo...']
    : isPodcast
    ? ['Cargando audio...', 'Iniciando pódcast...']
    : ['Sintonizando canal...', 'Estabilizando señal...', 'Iniciando transmisión...'];

  useEffect(() => {
    const timer1 = setTimeout(() => setStepIndex(1), 1200);
    const timer2 = setTimeout(() => setStepIndex(2), 2600);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const badgeText = isMovie 
    ? 'PELÍCULA' 
    : isSeries 
    ? 'SERIE' 
    : isSports 
    ? 'DEPORTES' 
    : isPodcast 
    ? 'PÓDCAST' 
    : 'CANAL EN VIVO';

  const posterImg = channel?.poster || channel?.logo;
  const title = channel?.displayName || channel?.name;

  return (
    <div className="relative flex flex-col items-center justify-center p-6 select-none max-w-sm w-full mx-auto">
      {/* Fondo ambiental sutil */}
      {posterImg && (
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-15">
          <img src={posterImg} alt="" className="w-full h-full object-cover blur-3xl scale-125" />
          <div className="absolute inset-0 bg-black/60" />
        </div>
      )}

      {/* Spinner cinematográfico minimalista y elegante */}
      <div className="relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 mb-3.5">
        {/* Halo de luz suave */}
        <div className="absolute inset-0 bg-rose-600/20 rounded-full blur-xl animate-pulse" />
        
        {/* Pista circular de giro suave */}
        <div 
          className="w-full h-full rounded-full border-2 border-white/10 border-t-rose-500 border-r-rose-500/30 animate-spin" 
          style={{ animationDuration: '0.9s' }}
        />
        
        {/* Contenido interior (Logo si existe, o ícono según tipo) */}
        {channel?.logo ? (
          <div className="absolute inset-2.5 sm:inset-3 rounded-full bg-black/70 backdrop-blur-md border border-white/10 p-2 flex items-center justify-center overflow-hidden shadow-inner">
            <img 
              src={channel.logo} 
              alt="" 
              className="w-full h-full object-contain filter drop-shadow"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        ) : (
          <div className="absolute inset-3 sm:inset-3.5 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center">
            {isMovie ? (
              <Film className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500/80" />
            ) : isSports ? (
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500/80" />
            ) : isPodcast ? (
              <Radio className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500/80" />
            ) : (
              <Tv className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500/80" />
            )}
          </div>
        )}
      </div>

      {/* Badge sutil de categoría */}
      <div className="mb-2 px-2.5 py-0.5 rounded-full bg-rose-600/15 border border-rose-500/30 backdrop-blur-md flex items-center gap-1.5 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
        <span className="text-[9px] font-black text-rose-400 tracking-[0.2em] uppercase">
          {badgeText}
        </span>
      </div>

      {/* Título de la película / canal */}
      {title && (
        <h3 className="text-white font-extrabold text-sm sm:text-base tracking-tight truncate max-w-[260px] sm:max-w-xs text-center mb-1 drop-shadow-sm">
          {title}
        </h3>
      )}

      {/* Estado dinámico discreto */}
      <p className="text-gray-400 text-xs font-medium tracking-wide text-center">
        {steps[stepIndex] || steps[0]}
      </p>

      {/* Barra de progreso ultra delgada */}
      <div className="w-32 sm:w-36 h-0.5 bg-white/10 rounded-full mt-3 overflow-hidden relative">
        <div className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-rose-500 to-transparent rounded-full animate-shimmer-slide" />
      </div>

      <style>{`
        @keyframes shimmer-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
        .animate-shimmer-slide {
          animation: shimmer-slide 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}
