import React from 'react';
import { Home, Film, Tv, Heart, Search, Trophy } from 'lucide-react';

const BOTTOM_TABS = [
  { key: 'Inicio',      label: 'Inicio',     Icon: Home },
  { key: 'Cine (VOD)',  label: 'Cine',       Icon: Film },
  { key: 'TV Abierta',  label: 'En Vivo',    Icon: Tv },
  { key: 'Favoritos',   label: 'Favoritos',  Icon: Heart },
  { key: '__search',    label: 'Buscar',     Icon: Search },
];

export default function BottomNav({ activeCategory, setActiveCategory, onSearchOpen }) {
  return (
    <nav className="md:hidden fixed bottom-2.5 sm:bottom-4 left-2.5 sm:left-4 right-2.5 sm:right-4 z-[70] safe-area-bottom pointer-events-none">
      <div className="flex items-center justify-around bg-[#08080a]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.9)] p-1 pointer-events-auto">
        {BOTTOM_TABS.map(({ key, label, Icon }) => {
          const isActive = key !== '__search' && activeCategory === key;
          
          return (
            <button
              key={key}
              onClick={() => {
                if (key === '__search') { 
                  onSearchOpen?.(); 
                  return; 
                }
                setActiveCategory(key);
              }}
              className={`
                relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl
                transition-all duration-300 ease-out active:scale-95 cursor-pointer
                ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-200'}
              `}
            >
              {/* Active glow bubble */}
              {isActive && (
                <div className="absolute inset-0 bg-rose-600/15 border border-rose-500/20 rounded-xl shadow-inner shadow-rose-500/10" />
              )}
              
              <Icon
                className={`w-5 h-5 transition-all duration-300 z-10 ${
                  isActive 
                    ? 'text-rose-500 scale-110 drop-shadow-[0_0_10px_rgba(225,29,72,0.9)]' 
                    : 'opacity-70 hover:opacity-100'
                }`}
                fill={isActive && key === 'Favoritos' ? 'currentColor' : 'none'}
              />
              
              <span 
                className={`text-[9px] font-extrabold uppercase tracking-wider z-10 mt-1 transition-colors ${
                  isActive ? 'text-rose-400 font-black' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
              
              {isActive && (
                <div className="absolute bottom-0.5 w-1 h-1 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(225,29,72,1)]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
