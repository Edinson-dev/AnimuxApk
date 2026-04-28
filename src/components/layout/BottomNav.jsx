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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[70] bg-black/95 backdrop-blur-3xl border-t border-white/[0.06] safe-area-bottom">
      <div className="flex items-stretch">
        {BOTTOM_TABS.map(({ key, label, Icon }) => {
          const isActive = key !== '__search' && activeCategory === key;
          return (
            <button
              key={key}
              onClick={() => {
                if (key === '__search') { onSearchOpen(); return; }
                setActiveCategory(key);
              }}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all duration-200 ${
                isActive ? 'text-rose-500' : 'text-gray-600 hover:text-gray-300'
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}
                fill={key === 'Favoritos' && isActive ? 'currentColor' : 'none'}
              />
              <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-rose-500' : ''}`}>
                {label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-rose-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
