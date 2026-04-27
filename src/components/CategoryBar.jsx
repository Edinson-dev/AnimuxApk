import React, { useRef, useEffect } from 'react';

export default function CategoryBar({ categories = [], activeCategory, setActiveCategory }) {
  const scrollRef = useRef(null);

  // Auto-scroll active chip into view
  useEffect(() => {
    if (!scrollRef.current) return;
    const active = scrollRef.current.querySelector('[data-active="true"]');
    if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeCategory]);

  return (
    <div className="md:hidden sticky top-[52px] z-[60] bg-black/95 backdrop-blur-xl border-b border-white/[0.04]">
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-2.5"
      >
        {['Inicio', ...categories].map(cat => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              data-active={isActive}
              onClick={() => setActiveCategory(cat)}
              className={`
                flex-shrink-0 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest
                transition-all duration-200 border whitespace-nowrap
                ${isActive
                  ? 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'bg-white/[0.05] border-white/[0.08] text-gray-400 hover:border-white/20 hover:text-white'
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
