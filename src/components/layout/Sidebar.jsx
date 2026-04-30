import React from 'react';
import { Home, Star, Tv, Film, Activity, Smile, Music, Zap, Heart, History, Layers, Monitor, RefreshCw, Flag, MapPin } from 'lucide-react';

const ICON_MAP = {
  'inicio': Home,
  'nuevos': Star,
  'series': Monitor,
  'peliculas': Film,
  'deportes': Activity,
  'infantil': Smile,
  'musica': Music,
  'anime': Zap,
  'favoritos': Heart,
  'recientes': History,
  'nacionales': Flag,
  'regional': MapPin,
};

const getCatIcon = (cat) => {
  const key = cat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  return ICON_MAP[key] || Layers;
};

export default function Sidebar({ categories = [], activeCategory, setActiveCategory, counts = {}, onRefresh, version, isKidsMode, setIsKidsMode }) {
  return (
    <aside className="hidden md:flex w-[64px] md:w-[220px] shrink-0 bg-[#090909] border-r border-white/[0.04] flex-col overflow-y-auto overflow-x-hidden custom-scrollbar z-30">

      {/* Section label - desktop only */}
      <div className="hidden md:flex items-center px-5 py-4 border-b border-white/[0.03]">
        <span className="text-[9px] font-black text-gray-700 uppercase tracking-[0.3em]">Navegar</span>
      </div>

      {/* Category list */}
      <nav className="flex-1 py-3 flex flex-col gap-0.5 px-2">
        {categories.map(cat => {
          const Icon = getCatIcon(cat);
          const isActive = activeCategory === cat;
          const count = counts[cat];

          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              title={cat}
              className={`
                group relative flex items-center gap-3 px-3 py-3 rounded-xl
                transition-all duration-200 w-full text-left
                ${isActive
                  ? 'bg-rose-600/15 text-white'
                  : 'text-gray-500 hover:bg-white/[0.04] hover:text-gray-200'
                }
              `}
            >
              {/* Active bar indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-rose-600 rounded-r-full" />
              )}

              <Icon
                className={`w-5 h-5 shrink-0 transition-colors duration-200 ${
                  isActive ? 'text-rose-500' : 'group-hover:text-gray-300'
                }`}
                fill={cat === 'Favoritos' && isActive ? 'currentColor' : 'none'}
              />

              {/* Label - desktop only */}
              <span className={`hidden md:block flex-1 text-[11px] font-bold uppercase tracking-[0.15em] truncate ${isActive ? 'text-white' : ''}`}>
                {cat}
              </span>

              {/* Count badge - desktop only */}
              {count !== undefined && count > 0 && (
                <span className={`hidden md:block text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[22px] text-center ${
                  isActive ? 'bg-rose-600/30 text-rose-400' : 'bg-white/[0.06] text-gray-600'
                }`}>
                  {count > 999 ? '999+' : count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="hidden md:block px-4 py-6 border-t border-white/[0.03] space-y-4">
        {/* Kids Mode Toggle */}
        <button
          onClick={() => setIsKidsMode(!isKidsMode)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all border group ${
            isKidsMode 
              ? 'bg-yellow-400 text-black border-yellow-500 shadow-lg shadow-yellow-400/20' 
              : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
          }`}
        >
          <Smile className={`w-4 h-4 ${isKidsMode ? 'fill-current' : 'group-hover:text-yellow-400'}`} />
          <span className="text-[10px] font-black uppercase tracking-widest">{isKidsMode ? 'Modo Kids On' : 'Modo Kids'}</span>
        </button>

        <button 
          onClick={() => {
            if (window.confirm('¿Quieres sincronizar los últimos canales y películas?')) {
              onRefresh();
              setTimeout(() => window.location.reload(), 1000);
            }
          }}
          className="w-full flex items-center gap-3 px-4 py-3 bg-rose-600/5 hover:bg-rose-600 text-rose-500 hover:text-white rounded-xl transition-all border border-rose-600/20 hover:border-rose-600/40 group"
        >
          <RefreshCw className="w-4 h-4 group-hover:animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-widest">Actualizar Datos</span>
        </button>
        <div className="flex flex-col items-center gap-1 px-2">
          <p className="text-[8px] text-rose-600/50 font-black uppercase tracking-widest">Animux v{version}</p>
          <p className="text-[7px] text-gray-800 font-bold uppercase tracking-[0.2em]">Sincronización Lista</p>
        </div>
      </div>
    </aside>
  );
}
