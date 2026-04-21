import React, { useEffect, useRef } from 'react';
import { Search, Tv } from 'lucide-react';

export default function Header({ searchQuery, setSearchQuery }) {
  const inputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  return (
    <header className="h-auto md:h-20 bg-[#050508]/60 backdrop-blur-3xl border-b border-white/5 flex flex-col md:flex-row items-center justify-between px-4 md:px-8 py-4 md:py-0 z-40 sticky top-0 transition-all duration-300 gap-4">
      <div className="flex items-center justify-between w-full md:w-auto">
        <div className="flex items-center gap-3 text-white font-black text-2xl tracking-tight group cursor-pointer">
          <div className="p-2 bg-indigo-600/20 rounded-xl border border-indigo-500/30 group-hover:bg-indigo-600/30 transition-colors">
            <Tv size={28} className="text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.8)] group-hover:scale-110 transition-transform duration-300" />
          </div>
          <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-indigo-300 drop-shadow-sm">
            Animux
          </span>
        </div>
        <div className="flex md:hidden items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
          <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
        </div>
      </div>
      
      <div className="relative w-full md:flex-1 md:max-w-xl group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors duration-300" />
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscar anime, canal, género (Ctrl+K)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/5 hover:bg-white/10 border border-white/10 group-focus-within:bg-black/50 group-focus-within:border-primary/50 group-focus-within:ring-4 group-focus-within:ring-primary/20 rounded-2xl py-3 pl-12 pr-6 text-white placeholder-gray-500 outline-none transition-all duration-300 shadow-inner"
        />
        {/* Keyboard shortcut icon placeholder */}
        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
          <span className="text-[10px] font-bold text-gray-500 border border-gray-600 rounded px-1.5 py-0.5 bg-background">Ctrl K</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
          <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
        </button>
      </div> 
    </header>
  );
}
