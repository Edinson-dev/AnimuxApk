import React, { useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

export default function CategoryBar({ categories = [], activeCategory, setActiveCategory, onInstall, showInstall, onRefresh }) {
  const scrollRef = useRef(null);

  // Auto-scroll active chip into view
  useEffect(() => {
    if (!scrollRef.current) return;
    const active = scrollRef.current.querySelector('[data-active="true"]');
    if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeCategory]);

  return (
    <div className="md:hidden sticky top-[52px] z-[60] bg-black/95 backdrop-blur-md border-b border-white/[0.04]">
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-2.5"
      >
        <button
          onClick={onRefresh}
          className="flex-shrink-0 p-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-gray-400 active:text-rose-500"
          title="Refrescar canales"
        >
          <RefreshCw className="w-4 h-4" />
        </button>



        {['Inicio', ...categories].map(cat => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              data-active={isActive}
              onClick={() => setActiveCategory(cat)}
              className={`
                flex-shrink-0 px-3 py-1.5 text-[13px] font-semibold tracking-wide
                transition-all duration-200 whitespace-nowrap
                ${isActive
                  ? 'text-rose-500 font-bold'
                  : 'text-gray-400 hover:text-gray-200'
                }
              `}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}
