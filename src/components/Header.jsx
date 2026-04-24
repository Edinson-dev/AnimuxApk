import React, { useState, useEffect } from 'react';
import { Search, Bell, X, Tv, Menu, Download, ChevronDown, LayoutGrid } from 'lucide-react';

export default function Header({ searchQuery, setSearchQuery, categories = [], activeCategory, onInstall, showInstall, onGoHome, setActiveCategory }) {
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
          onClick={onGoHome}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-8 h-8 md:w-9 md:h-9 bg-black rounded-lg flex items-center justify-center shadow-2xl border border-white/10 group-hover:border-rose-500 transition-all duration-500 overflow-hidden">
             <img src="/icon-512.png" alt="Animux" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tighter text-white uppercase italic hidden sm:block">
            Animux
          </h1>
        </div>

        {/* Categories Nav (Horizontal Scroll) */}
        <div className="flex-1 relative group overflow-hidden">
          <nav id="category-nav" className="flex items-center gap-4 md:gap-10 overflow-x-auto no-scrollbar scroll-smooth">
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-[11px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all relative py-3 ${activeCategory === cat ? 'text-white' : 'text-gray-500 hover:text-white'}`}
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
              className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] whitespace-nowrap text-rose-500 hover:text-rose-400 transition-all py-3 flex items-center gap-2 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Instalar App
            </button>
          )}
          </nav>
        </div>

        {/* Right Section: Search */}
        <div className="flex items-center gap-4 shrink-0">
           <div className="hidden md:flex items-center bg-white/5 border border-white/5 focus-within:border-white/20 rounded-full py-1.5 px-4 transition-all w-32 lg:w-48">
              <Search className="w-3.5 h-3.5 text-gray-400" />
              <input 
                type="text" 
                placeholder="BUSCAR..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-[10px] font-bold text-white px-2 w-full uppercase tracking-widest"
              />
           </div>

           <button 
            onClick={() => setIsMobileSearchOpen(true)}
            className="md:hidden p-2 text-white hover:bg-white/10 rounded-full"
           >
              <Search className="w-5 h-5" />
           </button>

           <button className="hidden md:flex p-2 text-white hover:bg-white/10 rounded-full transition-all relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-600 rounded-full" />
           </button>
        </div>

        {/* Mobile Search Overlay */}
        {isMobileSearchOpen && (
          <div className="fixed inset-0 bg-black z-[100] p-6 animate-fade-in flex flex-col gap-6">
            <div className="flex items-center justify-between">
               <h2 className="text-xl font-black text-white uppercase tracking-tighter">Buscar</h2>
               <button onClick={() => setIsMobileSearchOpen(false)} className="p-2 bg-white/5 rounded-full"><X className="w-6 h-6 text-white" /></button>
            </div>
            <input 
              autoFocus type="text" placeholder="¿QUÉ QUIERES VER?" value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:border-rose-600 transition-all uppercase tracking-widest text-xs"
            />
          </div>
        )}
      </div>
    </header>
  );
}
