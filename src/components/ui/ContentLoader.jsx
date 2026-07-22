import React from 'react';
import SoccerLoader from './SoccerLoader';
import FilmLoader from './FilmLoader';
import { Disc } from 'lucide-react';

export default function ContentLoader({ channel, className = "w-16 h-16" }) {
  const catLower = (channel?.category || '').toLowerCase();
  const nameLower = (channel?.name || channel?.displayName || '').toLowerCase();

  const isPodcast = channel?.isPodcast || catLower === 'podcasts' || catLower === 'podcast';
  const isVOD = channel?.isVOD === true;
  const isSeries = isVOD && !!channel?.groupId;
  const isMovie = isVOD && !channel?.groupId;
  
  const isSports = /deportes|sports|futbol|fútbol|mundial|fifa|espn|fox|directv|dsports|tnt sports|champions|liga|copa/i.test(catLower) ||
                   /futbol|fútbol|mundial|fifa|match|vs|partido/i.test(nameLower);

  let loaderComponent = null;
  let statusText = 'Optimizando Señal...';

  if (isPodcast) {
    statusText = 'Cargando Pódcast...';
    loaderComponent = (
      <div className={`relative flex items-center justify-center ${className}`}>
        <div className="absolute inset-0 bg-violet-600/30 rounded-full blur-xl animate-pulse" />
        <Disc className="w-full h-full text-rose-500 animate-spin-slow drop-shadow-[0_0_15px_rgba(225,29,72,0.6)]" />
      </div>
    );
  } else if (isMovie) {
    statusText = 'Cargando Película...';
    loaderComponent = <FilmLoader className={className} />;
  } else if (isSeries) {
    statusText = 'Cargando Episodio...';
    loaderComponent = <FilmLoader className={className} />;
  } else if (isSports) {
    statusText = 'Optimizando Señal Deportiva...';
    loaderComponent = <SoccerLoader className={className} />;
  } else {
    // Para TV en vivo general o canales en vivo
    statusText = 'Optimizando Señal...';
    loaderComponent = <SoccerLoader className={className} />;
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative mb-6">
        {loaderComponent}
      </div>
      <p className="text-white font-black text-[11px] tracking-[0.5em] uppercase opacity-80 animate-pulse text-center">
        {statusText}
      </p>
      <div className="mt-8 flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="w-1 h-4 bg-white/10 rounded-full overflow-hidden">
            <div className="w-full h-full bg-rose-600 animate-loading-bar" style={{ animationDelay: `${i * 0.1}s` }} />
          </div>
        ))}
      </div>
    </div>
  );
}
