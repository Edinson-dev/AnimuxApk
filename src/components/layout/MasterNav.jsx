import React from 'react';
import { Home, Tv, Film, MonitorPlay, Heart } from 'lucide-react';

export const MASTER_TABS = [
  { id: 'home', label: 'Inicio', icon: Home, badge: null },
  { id: 'live', label: 'TV en Vivo', icon: Tv, badge: 'LIVE' },
  { id: 'movies', label: 'Películas', icon: Film, badge: 'VOD' },
  { id: 'series', label: 'Series', icon: MonitorPlay, badge: 'HD' },
  { id: 'favorites', label: 'Mi Espacio', icon: Heart, badge: null },
];

export default function MasterNav({ activeTab = 'home', onSelectTab }) {
  return (
    <nav className="flex items-center gap-1.5 p-1 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-inner">
      {MASTER_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`
              relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider
              transition-all duration-300 select-none group
              ${
                isActive
                  ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-lg shadow-rose-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
              }
            `}
          >
            <Icon
              className={`w-4 h-4 transition-transform duration-300 ${
                isActive ? 'scale-110 text-white' : 'group-hover:scale-105'
              }`}
            />
            <span className="hidden sm:inline-block">{tab.label}</span>

            {tab.badge && (
              <span
                className={`text-[8px] font-black px-1.5 py-0.2 rounded-full tracking-tighter hidden md:inline-block ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {tab.badge}
              </span>
            )}

            {/* Micro indicador activo */}
            {isActive && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-rose-400 rounded-full shadow-[0_0_8px_rgba(244,63,94,1)]" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
