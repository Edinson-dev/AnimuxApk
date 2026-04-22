import React, { useState, useEffect } from 'react';
import { Search, Bell, User, Menu, X, PlayCircle } from 'lucide-react';

export default function Header({ searchQuery, setSearchQuery }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const categories = ['Todos', 'Series', 'Filmes', 'Infantil', 'Anime', 'Deportes', 'Documentales', 'Favoritos'];

  return (
    <header className={`fixed top-0 left-0 right-0 z-[80] transition-all duration-500 ${isScrolled ? 'bg-[#060608]/90 backdrop-blur-2xl py-3 shadow-2xl border-b border-white/5' : 'bg-gradient-to-b from-black/80 to-transparent py-5 md:py-8'}`}>
      <div className="max-w-[1800px] mx-auto px-4 md:px-12 flex items-center justify-between gap-8">
        
        {/* Logo & Desktop Nav */}
        <div className="flex items-center gap-12">
          <div 
            onClick={() => window.onGoHome && window.onGoHome()}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)] group-hover:scale-110 transition-all duration-500">
               <PlayCircle className="w-6 h-6 text-white fill-current ml-0.5" />
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tighter text-white uppercase italic hidden sm:block">
              Animux<span className="text-indigo-500">Live</span>
            </h1>
          </div>

          {/* Desktop Categories */}
          <nav className="hidden lg:flex items-center gap-8">
            {categories.slice(0, 7).map(cat => (
              <button 
                key={cat}
                onClick={() => window.setActiveCategory && window.setActiveCategory(cat)}
                className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-white transition-all relative group"
              >
                {cat}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 transition-all group-hover:w-full rounded-full" />
              </button>
            ))}
          </nav>
        </div>

        {/* Search & Profile */}
        <div className="flex-1 max-w-md hidden md:block">
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="text"
                placeholder="Películas, canales, series..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/5 focus:border-indigo-500/50 focus:bg-white/10 rounded-full py-2.5 pl-12 pr-6 text-sm text-white placeholder-gray-500 outline-none transition-all"
              />
           </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
           <button 
             onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
             className="md:hidden p-2 text-gray-400 hover:text-white"
           >
             <Search className="w-6 h-6" />
           </button>
           <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5 md:w-6 md:h-6" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-[#060608]" />
           </button>
           <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl border border-white/20 shadow-lg cursor-pointer overflow-hidden">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
           </div>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <div className="absolute top-0 left-0 right-0 h-20 bg-[#060608] flex items-center px-4 animate-fade-in md:hidden border-b border-white/10">
           <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500" />
              <input 
                autoFocus
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 rounded-full py-3 pl-12 pr-12 text-sm text-white outline-none"
              />
              <button 
                onClick={() => setIsMobileSearchOpen(false)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
           </div>
        </div>
      )}

      {/* Horizontal Tabs (Mobile) */}
      <div className="lg:hidden w-full overflow-x-auto no-scrollbar py-3 px-4 flex gap-4 md:gap-8 border-t border-white/5 bg-black/20">
         {categories.map(cat => (
           <button 
             key={cat}
             onClick={() => window.setActiveCategory && window.setActiveCategory(cat)}
             className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white whitespace-nowrap px-2"
           >
             {cat}
           </button>
         ))}
      </div>
    </header>
  );
}
