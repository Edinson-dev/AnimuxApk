import React from 'react';
import { Home, Star, Tv, Film, Activity, Smile, Music, Zap, Heart, History, Layers, Monitor } from 'lucide-react';

const ICON_MAP = {
  'inicio': Home,
  'nuevos': Star,
  'series': Monitor,
  'peliculas': Film,
  'peliculas': Film,
  'deportes': Activity,
  'infantil': Smile,
  'musica': Music,
  'anime': Zap,
  'favoritos': Heart,
  'recientes': History,
};

const getCatIcon = (cat) => {
  const key = cat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  return ICON_MAP[key] || Layers;
};

export default function Sidebar({ categories = [], activeCategory, setActiveCategory, counts = {} }) {
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
      <div className="hidden md:block px-5 py-3 border-t border-white/[0.03]">
        <p className="text-[8px] text-gray-700 font-bold uppercase tracking-widest">Animux © 2025</p>
      </div>
    </aside>
  );
}
