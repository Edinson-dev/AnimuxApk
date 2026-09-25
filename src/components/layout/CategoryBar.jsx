import React, { useRef, useEffect } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { getCatInfo } from './Sidebar';

export default function CategoryBar({ 
  categories = [], 
  activeCategory, 
  setActiveCategory, 
  onRefresh 
}) {
  const scrollRef = useRef(null);

  // Auto-scroll active chip smoothly into center view
  useEffect(() => {
    if (!scrollRef.current) return;
    const active = scrollRef.current.querySelector('[data-active="true"]');
    if (active) {
      active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeCategory]);

  const allCats = ['Inicio', ...categories];

  return (
    <div className="md:hidden shrink-0 z-[60] bg-[#070709]/98 backdrop-blur-2xl border-b border-white/[0.06] py-2 px-3.5 shadow-md shadow-black/50">
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5"
      >
        {/* Quick Refresh icon */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="shrink-0 p-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-gray-400 active:text-rose-500 hover:text-white transition-all active:scale-90"
            title="Refrescar contenidos"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}

        {allCats.map((cat) => {
          const isActive = activeCategory === cat;
          const { icon: Icon, color: catColor } = getCatInfo(cat);

          return (
            <button
              key={cat}
              data-active={isActive}
              onClick={() => setActiveCategory(cat)}
              className={`
                shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider
                transition-all duration-300 select-none whitespace-nowrap active:scale-95 cursor-pointer
                ${isActive
                  ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-lg shadow-rose-600/40 border border-rose-400/30'
                  : 'bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
                }
              `}
            >
              <Icon 
                className={`w-3.5 h-3.5 shrink-0 transition-transform ${isActive ? 'scale-110' : ''}`}
                style={!isActive && catColor ? { color: catColor } : undefined}
                fill={cat === 'Favoritos' && isActive ? 'currentColor' : 'none'}
              />
              <span>{cat}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
