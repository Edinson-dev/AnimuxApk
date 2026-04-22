import React from 'react';
import { Search, Bell, PlayCircle } from 'lucide-react';

export default function Header({ searchQuery, setSearchQuery }) {
  return (
    <header className="sticky top-0 z-[60] glass-panel border-b border-white/5 px-6 py-4 flex items-center justify-between gap-8 bg-[#060608]/80 backdrop-blur-3xl">
      {/* Brand Logo - Cuevana Style */}
      <div className="flex items-center gap-3 shrink-0 cursor-pointer group">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
          <PlayCircle className="w-6 h-6 text-white fill-current" />
        </div>
        <span className="text-2xl font-black tracking-tighter text-white uppercase hidden md:block">
          Animux<span className="text-indigo-500">Live</span>
        </span>
      </div>

      {/* Modern Search Bar */}
      <div className="flex-1 max-w-2xl relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-400 transition-colors" />
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Busca tus series, películas o canales favoritos..."
          className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white/[0.08] transition-all placeholder:text-gray-500 shadow-inner"
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
