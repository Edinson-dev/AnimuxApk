import React, { useState, useEffect } from 'react';
import SportsLoader from './SportsLoader';
import FilmLoader from './FilmLoader';
import TvLoader from './TvLoader';
import { Disc, Sparkles } from 'lucide-react';

export default function ContentLoader({ channel, className = "w-20 h-20" }) {
  const catLower = (channel?.category || '').toLowerCase();
  const nameLower = (channel?.name || channel?.displayName || '').toLowerCase();

  const isPodcast = channel?.isPodcast || catLower === 'podcasts' || catLower === 'podcast';
  const isVOD = channel?.isVOD === true || /pelicula|película|cine|series|movie|film|vod|estreno/i.test(catLower);
  const isSeries = isVOD && (!!channel?.groupId || /serie|season|temporada|episodio/i.test(catLower));
  const isMovie = isVOD && !isSeries;
  const isSports = /deportes|sports|futbol|fútbol|mundial|fifa|espn|fox sports|dsports|directv sports|tnt sports|champions|liga|copa|lucha|wwe|ufc|nba|f1|formula 1|beisbol|béisbol/i.test(catLower) ||
                   /futbol|fútbol|mundial|fifa|match|vs|partido/i.test(nameLower);

  // Micro-estados de carga progresiva estilo Netflix / HBO
  const [stepIndex, setStepIndex] = useState(0);

  const steps = isMovie
    ? ['Cargando experiencia 4K...', 'Optimizando audio envolvente...', 'Iniciando reproducción...']
    : isSeries
    ? ['Localizando episodio...', 'Conectando fuente de alta fidelidad...', 'Iniciando reproducción...']
    : isSports
    ? ['Sintonizando transmisión en vivo...', 'Sincronizando feed 60FPS...', 'Estabilizando señal deportiva...']
    : isPodcast
    ? ['Cargando pista de audio...', 'Optimizando buffer...', 'Listo para escuchar...']
    : ['Conectando satélite digital...', 'Optimizando señal en vivo...', 'Iniciando transmisión...'];

  useEffect(() => {
    const timer1 = setTimeout(() => setStepIndex(1), 1200);
    const timer2 = setTimeout(() => setStepIndex(2), 2800);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  let loaderComponent = null;
  let badgeText = isMovie ? '4K ULTRA HD • HDR' : isSeries ? 'SERIE PREMIUM' : isSports ? 'EN VIVO • DEPORTES' : isPodcast ? 'AUDIO HI-RES' : 'SEÑAL EN VIVO';

  if (isPodcast) {
    loaderComponent = (
      <div className={`relative flex items-center justify-center ${className}`}>
        <div className="absolute inset-0 bg-violet-600/30 rounded-full blur-xl animate-pulse" />
        <Disc className="w-full h-full text-rose-500 animate-spin-slow drop-shadow-[0_0_20px_rgba(225,29,72,0.6)]" />
      </div>
    );
  } else if (isMovie || isSeries) {
    loaderComponent = <FilmLoader className={className} />;
  } else if (isSports) {
    loaderComponent = <SportsLoader channel={channel} className={className} />;
  } else {
    loaderComponent = <TvLoader className={className} />;
  }

  const posterImg = channel?.poster || channel?.logo;

  return (
    <div className="relative flex flex-col items-center justify-center p-6 select-none">
      {/* Fondo ambiental desenfocado estilo Netflix */}
      {posterImg && (
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-20">
          <img src={posterImg} alt="" className="w-full h-full object-cover blur-3xl scale-125" />
          <div className="absolute inset-0 bg-black/60" />
        </div>
      )}

      {/* Loader visual central */}
      <div className="relative mb-6">
        {loaderComponent}
      </div>

      {/* Badge de especificación técnica */}
      <div className="mb-3 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-xl flex items-center gap-2 shadow-lg shadow-black/40">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
        <span className="text-[9px] font-black text-white/90 tracking-[0.25em] uppercase">
          {badgeText}
        </span>
        <Sparkles className="w-3 h-3 text-rose-400 opacity-80" />
      </div>

      {/* Título del canal o película que se está cargando */}
      <h3 className="text-white font-extrabold text-sm md:text-base tracking-tight uppercase max-w-sm truncate text-center mb-1">
        {channel?.displayName || channel?.name || 'Contenido Premium'}
      </h3>

      {/* Texto de micro-estado dinámico */}
      <p className="text-rose-400 font-bold text-[10px] tracking-[0.3em] uppercase opacity-90 animate-pulse text-center">
        {steps[stepIndex] || steps[0]}
      </p>

      {/* Shimmer line de carga infinita */}
      <div className="w-44 h-1 bg-white/10 rounded-full mt-4 overflow-hidden relative">
        <div className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-rose-500 to-transparent rounded-full animate-shimmer-slide" />
      </div>

      <style>{`
        @keyframes shimmer-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
        .animate-shimmer-slide {
          animation: shimmer-slide 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}
