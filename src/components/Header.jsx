import React from 'react';
import { Search, Bell, PlayCircle } from 'lucide-react';

export default function Header({ searchQuery, setSearchQuery }) {
  return (
    <header className="sticky top-0 z-[60] bg-[#060608]/80 backdrop-blur-3xl border-b border-white/[0.05]">
      <div className="px-4 md:px-8 py-3 md:py-4 flex items-center justify-between gap-4 md:gap-8">
        {/* Brand Logo */}
        <div 
          onClick={() => {
            setSearchQuery('');
            if (window.onGoHome) window.onGoHome();
          }}
          className="flex items-center gap-2 md:gap-3 shrink-0 cursor-pointer group"
        >
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-tr from-indigo-700 to-indigo-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] group-hover:rotate-12 transition-all duration-500">
            <PlayCircle className="w-6 h-6 md:w-7 md:h-7 text-white fill-current" />
          </div>
          <span className="text-xl md:text-2xl font-black tracking-tighter text-white uppercase hidden sm:block">
            Animux<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600">Live</span>
          </span>
        </div>

        {/* Modern Search Bar */}
        <div className="flex-1 max-w-2xl relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-indigo-400 group-focus-within:scale-110 transition-all" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar..."
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-full py-2.5 md:py-4 pl-11 md:pl-14 pr-4 md:pr-6 text-xs md:text-sm font-semibold text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white/[0.05] focus:border-indigo-500/40 transition-all placeholder:text-gray-600 shadow-2xl"
          />
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <button className="p-2 md:p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-all hidden md:block">
            <Bell className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-indigo-500/30 overflow-hidden cursor-pointer hover:border-indigo-500 transition-all p-0.5">
            <img src="https://ui-avatars.com/api/?name=User&background=6366f1&color=fff" className="w-full h-full rounded-full" alt="User" />
          </div>
        </div>
      </div>
      
      {/* Category Quick Links (Responsive) */}
      <div className="flex gap-2 md:gap-4 overflow-x-auto no-scrollbar px-4 md:px-8 pb-3 md:pb-4">
         {['Todos', 'Cine', 'Series', 'Infantil', 'Anime', 'Deportes', 'Documentales', 'Noticias', 'Favoritos'].map(cat => (
           <button 
             key={cat}
             onClick={() => {
                if (window.setActiveCategory) window.setActiveCategory(cat);
             }}
             className="shrink-0 px-4 md:px-6 py-1.5 md:py-2 rounded-full bg-white/5 border border-white/5 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/10 active:bg-indigo-600 active:text-white transition-all"
           >
             {cat}
           </button>
         ))}
      </div>
    </header>
  );
}
