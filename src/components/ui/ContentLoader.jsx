import React from 'react';
import SportsLoader from './SportsLoader';
import FilmLoader from './FilmLoader';
import TvLoader from './TvLoader';
import { Disc } from 'lucide-react';

export default function ContentLoader({ channel, className = "w-20 h-20" }) {
  const catLower = (channel?.category || '').toLowerCase();
  const nameLower = (channel?.name || channel?.displayName || '').toLowerCase();

  const isPodcast = channel?.isPodcast || catLower === 'podcasts' || catLower === 'podcast';
  
  // Detección mejorada de VOD / Películas / Series (incluso si isVOD no viene boolean explicito)
  const isVOD = channel?.isVOD === true || /pelicula|película|cine|series|movie|film|vod|estreno/i.test(catLower);
  const isSeries = isVOD && (!!channel?.groupId || /serie|season|temporada|episodio/i.test(catLower));
  const isMovie = isVOD && !isSeries;
  
  // Detección de Deportes
  const isSports = /deportes|sports|futbol|fútbol|mundial|fifa|espn|fox sports|dsports|directv sports|tnt sports|champions|liga|copa|lucha|wwe|ufc|nba|f1|formula 1|beisbol|béisbol/i.test(catLower) ||
                   /futbol|fútbol|mundial|fifa|match|vs|partido/i.test(nameLower);

  let loaderComponent = null;
  let statusText = 'Optimizando Señal...';
  let badgeText = null;

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
    statusText = 'Sintonizando Transmisión HD...';
    badgeText = 'EN VIVO • DEPORTES';
    loaderComponent = <SportsLoader channel={channel} className={className} />;
  } else {
    // Para TV en vivo general
    statusText = 'Optimizando Señal en Vivo...';
    badgeText = 'SEÑAL EN VIVO';
    loaderComponent = <TvLoader className={className} />;
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative mb-5">
        {loaderComponent}
      </div>

      {badgeText && (
        <div className="mb-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 backdrop-blur-md flex items-center gap-1.5 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
          <span className="text-[9px] font-black text-rose-400 tracking-[0.2em] uppercase">
            {badgeText}
          </span>
        </div>
      )}

      <p className="text-white font-black text-[11px] tracking-[0.4em] uppercase opacity-90 animate-pulse text-center">
        {statusText}
      </p>

      {/* Ecualizador tecnológico de señal */}
      <div className="mt-5 flex items-end gap-1.5 h-4">
        {[40, 75, 100, 60, 85, 50].map((height, i) => (
          <div 
            key={i} 
            className="w-1 bg-gradient-to-t from-rose-600 to-rose-400 rounded-full animate-loading-bar" 
            style={{ 
              height: `${height}%`,
              animationDelay: `${i * 0.12}s` 
            }} 
          />
        ))}
      </div>
    </div>
  );
}
