import React from 'react';
import { Search, Bell, PlayCircle } from 'lucide-react';

export default function Header({ searchQuery, setSearchQuery }) {
  return (
    <header className="sticky top-0 z-[60] bg-black/40 backdrop-blur-3xl border-b border-white/[0.05] px-6 py-4 flex items-center justify-between gap-8">
      {/* Brand Logo */}
      <div 
        onClick={() => {
          setSearchQuery('');
          if (window.onGoHome) window.onGoHome();
        }}
        className="flex items-center gap-3 shrink-0 cursor-pointer group"
      >
        <div className="w-12 h-12 bg-gradient-to-tr from-indigo-700 to-indigo-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] group-hover:rotate-12 transition-all duration-500">
          <PlayCircle className="w-7 h-7 text-white fill-current" />
        </div>
        <span className="text-2xl font-black tracking-tighter text-white uppercase hidden md:block">
          Animux<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600">Live</span>
        </span>
      </div>

      {/* Modern Search Bar */}
      <div className="flex-1 max-w-2xl relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-indigo-400 group-focus-within:scale-110 transition-all" />
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Busca tus series, películas o canales favoritos..."
          className="w-full bg-white/[0.02] border border-white/[0.08] rounded-[1.25rem] py-4 pl-14 pr-6 text-sm font-semibold text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white/[0.05] focus:border-indigo-500/40 transition-all placeholder:text-gray-600 shadow-2xl"
        />
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-4 shrink-0">
        <button className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-all hidden md:block">
          <Bell className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500/30 overflow-hidden cursor-pointer hover:border-indigo-500 transition-all p-0.5">
          <img src="https://ui-avatars.com/api/?name=User&background=6366f1&color=fff" className="w-full h-full rounded-full" alt="User" />
        </div>
      </div>
    </header>
  );
}
