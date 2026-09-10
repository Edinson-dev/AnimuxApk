import React from 'react';
import { Home, Tv, Film, MonitorPlay, Heart } from 'lucide-react';

const BOTTOM_TABS = [
  { key: 'home',      label: 'Inicio',    Icon: Home },
  { key: 'live',      label: 'En Vivo',   Icon: Tv },
  { key: 'movies',    label: 'Cine',      Icon: Film },
  { key: 'series',    label: 'Series',    Icon: MonitorPlay },
  { key: 'favorites', label: 'Mi Lista',  Icon: Heart },
];

export default function BottomNav({ masterTab = 'home', setMasterTab }) {
  return (
    <nav className="md:hidden fixed bottom-3 left-3 right-3 z-[70] pb-safe pointer-events-none">
      <div className="flex items-stretch bg-[#0c0d12]/90 backdrop-blur-2xl border border-white/10 rounded-[1.75rem] shadow-2xl shadow-black/80 overflow-hidden pointer-events-auto">
        {BOTTOM_TABS.map(({ key, label, Icon }) => {
          const isActive = masterTab === key;
          return (
            <button
              key={key}
              onClick={() => setMasterTab(key)}
              className="relative flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-all duration-300 ease-out"
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-t from-rose-600/15 via-rose-600/5 to-transparent opacity-100 transition-opacity" />
              )}
              
              <Icon
                className={`w-5 h-5 transition-all duration-300 z-10 ${
                  isActive 
                    ? 'text-rose-500 scale-110 drop-shadow-[0_0_10px_rgba(225,29,72,0.9)]' 
                    : 'text-white/40 hover:text-white/80'
                }`}
                fill={isActive && key === 'favorites' ? 'currentColor' : 'none'}
              />
              
              <span 
                className={`text-[8px] font-black uppercase tracking-[0.15em] z-10 transition-colors duration-300 ${
                  isActive ? 'text-rose-400 font-extrabold' : 'text-white/30'
                }`}
              >
                {label}
              </span>
              
              {isActive && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(225,29,72,1)]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

