import React from 'react';
import { Home, Music, Trophy, Heart, Search } from 'lucide-react';

const BOTTOM_TABS = [
  { key: 'Inicio',    label: 'Inicio',    Icon: Home },
  { key: 'Música',    label: 'Música',    Icon: Music },
  { key: 'Deportes',  label: 'Deportes',  Icon: Trophy },
  { key: 'Favoritos', label: 'Favoritos', Icon: Heart },
  { key: '__search',  label: 'Buscar',    Icon: Search },
];

export default function BottomNav({ activeCategory, setActiveCategory, onSearchOpen }) {
  return (
    <nav className="md:hidden fixed bottom-4 left-4 right-4 z-[70] pb-safe pointer-events-none">
      <div className="flex items-stretch bg-black/80 backdrop-blur-md border border-white/10 rounded-[2rem] shadow-2xl shadow-rose-900/10 overflow-hidden pointer-events-auto">
        {BOTTOM_TABS.map(({ key, label, Icon }) => {
          const isActive = key !== '__search' && activeCategory === key;
          return (
            <button
              key={key}
              onClick={() => {
                if (key === '__search') { onSearchOpen(); return; }
                setActiveCategory(key);
              }}
              className="relative flex-1 flex flex-col items-center justify-center gap-1.5 py-3.5 transition-all duration-300 ease-out"
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-t from-rose-500/10 to-transparent opacity-100 transition-opacity" />
              )}
              
              <Icon
                className={`w-[22px] h-[22px] transition-all duration-300 z-10 ${
                  isActive 
                    ? 'text-rose-500 scale-110 drop-shadow-[0_0_8px_rgba(225,29,72,0.8)]' 
                    : 'text-white/40 hover:text-white/80 hover:scale-105'
                }`}
                fill={isActive && key !== '__search' ? 'currentColor' : 'none'}
              />
              
              <span 
                className={`text-[8px] font-black uppercase tracking-[0.2em] z-10 transition-colors duration-300 ${
                  isActive ? 'text-rose-400' : 'text-white/30'
                }`}
              >
                {label}
              </span>
              
              {isActive && (
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-rose-500 rounded-full shadow-[0_0_10px_rgba(225,29,72,1)]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
