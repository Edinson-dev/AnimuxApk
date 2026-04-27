import React from 'react';
import { Search, Bell, X } from 'lucide-react';
import InstallPWA from './InstallPWA';

export default function Header({ searchQuery, setSearchQuery, onGoHome, onInstall, showInstall }) {

  return (
    <header className="fixed top-0 left-0 right-0 z-[80] bg-black/95 backdrop-blur-3xl border-b border-white/[0.05] py-3">
      <div className="max-w-[1920px] mx-auto px-4 md:px-6 flex items-center gap-4">

        {/* Logo */}
        <div onClick={onGoHome} className="flex items-center gap-3 cursor-pointer group shrink-0">
          <div className="w-8 h-8 md:w-9 md:h-9 bg-black rounded-xl flex items-center justify-center shadow-xl border border-white/10 group-hover:border-rose-500 transition-all duration-300 overflow-hidden">
            <img src="/icon-192.png" alt="Animux" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tighter text-white uppercase hidden sm:block">
            Animux
          </h1>
        </div>

        {/* Search bar — desktop */}
        <div className="flex-1 max-w-lg hidden md:flex items-center bg-white/[0.05] border border-white/[0.07] focus-within:border-rose-600/40 focus-within:bg-white/[0.08] rounded-full py-2 px-5 transition-all gap-2">
          <Search className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          <input
            type="text"
            placeholder="Buscar canales, películas, series..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-[11px] font-medium text-white w-full placeholder:text-gray-600"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-gray-500 hover:text-white transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex-1 md:hidden" /> {/* spacer mobile */}

        {/* Right controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-600 rounded-full" />
          </button>

          {/* Install button — visible on all screen sizes */}
          <InstallPWA
            onInstall={onInstall}
            showInstall={showInstall}
            variant="header"
          />
        </div>
      </div>
    </header>
  );
}
