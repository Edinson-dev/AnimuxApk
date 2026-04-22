import React, { useState, useEffect } from 'react';
import { Search, Bell, X, PlayCircle, Menu } from 'lucide-react';

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
    <header className={`fixed top-0 left-0 right-0 z-[80] transition-all duration-500 ${isScrolled ? 'bg-black/90 backdrop-blur-3xl border-b border-white/[0.05] py-3' : 'bg-gradient-to-b from-black/90 via-black/40 to-transparent py-6 md:py-10'}`}>
      <div className="max-w-[1800px] mx-auto px-6 md:px-12 flex items-center justify-between gap-6">
        
        {/* Left Section: Logo & Desktop Nav */}
        <div className="flex items-center gap-10">
          <div 
            onClick={() => window.onGoHome && window.onGoHome()}
            className="flex items-center gap-2 cursor-pointer group shrink-0"
          >
            <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-lg flex items-center justify-center shadow-2xl group-hover:bg-indigo-500 transition-all duration-500">
               <PlayCircle className="w-5 h-5 md:w-6 md:h-6 text-black fill-current" />
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tighter text-white uppercase italic hidden sm:block">
              Animux<span className="text-white/50">Max</span>
            </h1>
          </div>

          {/* Desktop Categories - HBO Style (All Caps, Spaced) */}
          <nav className="hidden lg:flex items-center gap-8">
            {categories.slice(0, 7).map(cat => (
              <button 
                key={cat}
                onClick={() => window.setActiveCategory && window.setActiveCategory(cat)}
                className="text-[12px] font-black uppercase tracking-[0.25em] text-gray-400 hover:text-white transition-all relative group py-2"
              >
                {cat}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all group-hover:w-full rounded-full" />
              </button>
            ))}
          </nav>
        </div>

        {/* Right Section: Search & Profile */}
        <div className="flex items-center gap-6">
           {/* Desktop Search Bar */}
           <div className="hidden md:flex items-center bg-white/5 border border-white/5 hover:border-white/20 focus-within:border-white/40 focus-within:bg-white/10 rounded-full py-2 px-6 transition-all max-w-[200px] lg:max-w-xs">
              <Search className="w-4 h-4 text-gray-400" />
              <input 
                type="text"
                placeholder="BUSCAR"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-[11px] font-black tracking-widest text-white placeholder-gray-500 ml-3 w-full uppercase"
              />
           </div>

           <button 
             onClick={() => setIsMobileSearchOpen(true)}
             className="md:hidden p-2 text-gray-400 hover:text-white"
           >
             <Search className="w-6 h-6" />
           </button>

           <div className="flex items-center gap-4">
              <button className="hidden sm:block text-[11px] font-black tracking-widest text-gray-400 hover:text-white uppercase transition-colors">Ingresa</button>
              <button className="px-5 py-2 bg-white text-black rounded-full text-[10px] font-black tracking-widest uppercase hover:bg-indigo-600 hover:text-white transition-all shadow-xl">Suscríbete</button>
           </div>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <div className="absolute top-0 left-0 right-0 h-24 bg-black flex items-center px-6 animate-fade-in md:hidden border-b border-white/10">
           <div className="flex-1 relative flex items-center gap-4">
              <Search className="w-5 h-5 text-indigo-500" />
              <input 
                autoFocus
                type="text"
                placeholder="¿QUÉ QUIERES VER?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm font-bold tracking-widest text-white placeholder-gray-600 uppercase"
              />
              <button 
                onClick={() => setIsMobileSearchOpen(false)}
                className="p-2 text-gray-400"
              >
                <X className="w-6 h-6" />
              </button>
           </div>
        </div>
      )}

      {/* Mobile Categories - Horizontal Scroll */}
      <div className="lg:hidden w-full overflow-x-auto no-scrollbar py-4 px-6 flex gap-8 border-t border-white/[0.03] bg-black/40 backdrop-blur-md">
         {categories.map(cat => (
           <button 
             key={cat}
             onClick={() => window.setActiveCategory && window.setActiveCategory(cat)}
             className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-white whitespace-nowrap"
           >
             {cat}
           </button>
         ))}
      </div>
    </header>
  );
}
