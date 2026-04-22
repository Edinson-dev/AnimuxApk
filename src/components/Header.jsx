import React from 'react';
import { Search, Bell, PlayCircle } from 'lucide-react';

export default function Header({ searchQuery, setSearchQuery }) {
  return (
    <header className="sticky top-0 z-[60] bg-[#060608] border-b border-white/5">
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Xuper-style Logo */}
        <div 
          onClick={() => {
            setSearchQuery('');
            if (window.onGoHome) window.onGoHome();
          }}
          className="flex items-center gap-1 cursor-pointer"
        >
          <span className="text-xl font-black italic tracking-tighter text-white">X</span>
          <span className="text-xl font-black italic tracking-tighter text-indigo-500 -ml-1">UPER</span>
          <span className="text-[8px] font-bold text-gray-500 self-end mb-1 ml-1">TV</span>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-4">
          <button onClick={() => {/* Toggle search */}} className="text-gray-400 hover:text-white">
            <Search className="w-5 h-5" />
          </button>
          <button className="text-gray-400 hover:text-white">
            <Clock className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Tab-style Categories */}
      <div className="flex gap-6 overflow-x-auto no-scrollbar px-4 pb-2">
         {['Recomendado', 'Filmes', 'Serie de TV', 'Infantil', 'Anime', 'Deportes'].map(cat => {
           const isActive = activeCategory === cat || (cat === 'Recomendado' && activeCategory === 'Todos');
           return (
             <button 
               key={cat}
               onClick={() => {
                  if (window.setActiveCategory) window.setActiveCategory(cat === 'Recomendado' ? 'Todos' : cat);
               }}
               className={`shrink-0 text-sm font-bold transition-all relative pb-1 ${isActive ? 'text-indigo-500' : 'text-gray-500'}`}
             >
               {cat}
               {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />}
             </button>
           );
         })}
      </div>
    </header>
  );
}
