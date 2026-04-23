import React, { useState, useEffect } from 'react';
import { Search, Bell, X, Tv, Menu, Download } from 'lucide-react';

export default function Header({ searchQuery, setSearchQuery, categories = [], activeCategory, onInstall, showInstall }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-[80] transition-all duration-500 ${isScrolled ? 'bg-black/95 backdrop-blur-3xl border-b border-white/[0.05] py-3' : 'bg-gradient-to-b from-black/95 via-black/40 to-transparent py-4'}`}>
      <div className="max-w-[1920px] mx-auto px-6 md:px-12 flex items-center justify-between gap-6">
        
        {/* Left Section: Logo */}
        <div 
          onClick={() => window.onGoHome && window.onGoHome()}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-8 h-8 md:w-9 md:h-9 bg-black rounded-lg flex items-center justify-center shadow-2xl border border-white/10 group-hover:border-rose-500 transition-all duration-500 overflow-hidden">
             <img src="/icon-512.png" alt="Animux" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tighter text-white uppercase italic hidden sm:block">
            Animux
          </h1>
        </div>

        {/* Dynamic Horizontal Scrolling Nav */}
        <nav className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-6 md:gap-10 px-4">
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => window.setActiveCategory && window.setActiveCategory(cat)}
              className={`text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all relative py-3 ${activeCategory === cat ? 'text-white' : 'text-gray-500 hover:text-white'}`}
            >
              {cat}
              {activeCategory === cat && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-rose-600 rounded-full animate-fade-in" />
              )}
            </button>
          ))}
          {showInstall && (
            <button 
              onClick={onInstall}
              className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] whitespace-nowrap text-rose-500 hover:text-rose-400 transition-all py-3 flex items-center gap-2 animate-pulse"
            >
              <Download className="w-3 h-3" />
              Instalar App
            </button>
          )}
        </nav>

        {/* Right Section: Search & Actions */}
        <div className="flex items-center gap-4 shrink-0">
           {/* Desktop Search */}
           <div className="hidden md:flex items-center bg-white/5 border border-white/5 focus-within:border-white/20 rounded-full py-1.5 px-4 transition-all w-32 lg:w-48">
              <Search className="w-3.5 h-3.5 text-gray-400" />
              <input 
                type="text"
                placeholder="BUSCAR"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-[10px] font-black tracking-widest text-white placeholder-gray-600 ml-2 w-full uppercase"
              />
           </div>

           <button 
             onClick={() => setIsMobileSearchOpen(true)}
             className="md:hidden p-2 text-gray-400 hover:text-white"
           >
             <Search className="w-5 h-5" />
           </button>

           <div className="hidden sm:flex items-center gap-4">
              {showInstall && (
                <button 
                  onClick={onInstall}
                  className="px-5 py-2 bg-rose-600 text-white rounded-full text-[9px] font-black tracking-widest uppercase hover:bg-rose-700 transition-all shadow-lg animate-bounce-subtle"
                >
                  Instalar App
                </button>
              )}
              <button className="px-5 py-2 bg-white text-black rounded-full text-[9px] font-black tracking-widest uppercase hover:bg-rose-600 hover:text-white transition-all">Suscripción</button>
           </div>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <div className="absolute top-0 left-0 right-0 h-20 bg-black flex items-center px-6 animate-fade-in md:hidden">
           <div className="flex-1 relative flex items-center gap-4">
              <Search className="w-5 h-5 text-rose-500" />
              <input 
                autoFocus
                type="text"
                placeholder="¿QUÉ QUIERES VER?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-xs font-bold tracking-widest text-white placeholder-gray-700 uppercase"
              />
              <button onClick={() => setIsMobileSearchOpen(false)} className="p-2 text-gray-500">
                <X className="w-6 h-6" />
              </button>
           </div>
        </div>
      )}
    </header>
  );
}
