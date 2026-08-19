import React from 'react';
import { Home, Star, Tv, Film, Activity, Smile, Music, Zap, Heart, History, Layers, Monitor, RefreshCw, Flag, MapPin, Scale } from 'lucide-react';

const ICON_MAP = {
  'inicio': { icon: Home, color: '#e11d48' },
  'nuevos': { icon: Star, color: '#f59e0b' },
  'series': { icon: Monitor, color: '#f97316' },
  'series (vod)': { icon: Monitor, color: '#f97316' },
  'peliculas': { icon: Film, color: '#e11d48' },
  'cine (vod)': { icon: Film, color: '#e11d48' },
  'deportes': { icon: Activity, color: '#22c55e' },
  'infantil': { icon: Smile, color: '#facc15' },
  'musica': { icon: Music, color: '#a855f7' },
  'anime': { icon: Zap, color: '#3b82f6' },
  'favoritos': { icon: Heart, color: '#ec4899' },
  'recientes': { icon: History, color: '#8b5cf6' },
  'nacionales': { icon: Flag, color: '#ef4444' },
  'regional': { icon: MapPin, color: '#14b8a6' },
  'entretenimiento': { icon: Tv, color: '#06b6d4' },
  'podcasts': { icon: Music, color: '#10b981' },
  'documentales': { icon: Film, color: '#14b8a6' },
  'maratones 24/7': { icon: RefreshCw, color: '#8b5cf6' },
  'tv abierta': { icon: Tv, color: '#3b82f6' },
};

const getCatInfo = (cat) => {
  const key = cat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  // Try exact match first, then partial
  if (ICON_MAP[key]) return ICON_MAP[key];
  for (const [k, v] of Object.entries(ICON_MAP)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return { icon: Layers, color: '#6b7280' };
};

import { BINANCE_REFERRAL, ADS_CONFIG } from '../../config/ads';

export default function Sidebar({ categories = [], activeCategory, setActiveCategory, counts = {}, onRefresh, version, isKidsMode, setIsKidsMode, onShowLegal, onShowTvGuide }) {
  const [copiedCode, setCopiedCode] = React.useState(false);

  const handleCopyCode = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(BINANCE_REFERRAL.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <aside className="hidden md:flex w-[64px] md:w-[220px] shrink-0 bg-[#090909] border-r border-white/[0.04] flex-col overflow-y-auto overflow-x-hidden custom-scrollbar z-30">

      {/* Section label - desktop only */}
      <div className="hidden md:flex items-center px-5 py-4 border-b border-white/[0.03]">
        <span className="text-[9px] font-black text-gray-700 uppercase tracking-[0.3em]">Navegar</span>
      </div>

      {/* Category list */}
      <nav className="flex-1 py-3 flex flex-col gap-0.5 px-2">
        {categories.map(cat => {
          const { icon: Icon, color: catColor } = getCatInfo(cat);
          const isActive = activeCategory === cat;
          const count = counts[cat];

          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              title={cat}
              className={`
                group relative flex items-center gap-3 px-3 py-3 rounded-xl
                transition-all duration-200 w-full text-left
                focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-rose-600/20 focus:text-white
                ${isActive
                  ? 'bg-white/[0.06] text-white'
                  : 'text-gray-500 hover:bg-white/[0.04] hover:text-gray-200'
                }
              `}
            >
              {/* Active bar indicator — colored per category */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full" style={{ backgroundColor: catColor }} />
              )}

              <Icon
                className="w-5 h-5 shrink-0 transition-colors duration-200"
                style={isActive ? { color: catColor } : {}}
                fill={cat === 'Favoritos' && isActive ? 'currentColor' : 'none'}
              />

              {/* Label - desktop only */}
              <span className={`hidden md:block flex-1 text-[11px] font-bold uppercase tracking-[0.15em] truncate ${isActive ? 'text-white' : ''}`}>
                {cat}
              </span>

              {/* Count badge - desktop only */}
              {count !== undefined && count > 0 && (
                <span 
                  className={`hidden md:block text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[22px] text-center ${
                    isActive ? 'text-white' : 'bg-white/[0.06] text-gray-600'
                  }`}
                  style={isActive ? { backgroundColor: `${catColor}30`, color: catColor } : {}}
                >
                  {count > 999 ? '999+' : count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="hidden md:block px-4 py-6 border-t border-white/[0.03] space-y-4">
        {/* Kids Mode Toggle */}
        <button
          onClick={() => setIsKidsMode(!isKidsMode)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all border group ${
            isKidsMode 
              ? 'bg-yellow-400 text-black border-yellow-500 shadow-lg shadow-yellow-400/20' 
              : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
          }`}
        >
          <Smile className={`w-4 h-4 ${isKidsMode ? 'fill-current' : 'group-hover:text-yellow-400'}`} />
          <span className="text-[10px] font-black uppercase tracking-widest">{isKidsMode ? 'Modo Kids On' : 'Modo Kids'}</span>
        </button>

        <button 
          onClick={() => {
            if (window.confirm('¿Quieres sincronizar los últimos canales y películas?')) {
              onRefresh();
              setTimeout(() => window.location.reload(), 1000);
            }
          }}
          className="w-full flex items-center gap-3 px-4 py-3 bg-rose-600/5 hover:bg-rose-600 text-rose-500 hover:text-white rounded-xl transition-all border border-rose-600/20 hover:border-rose-600/40 group"
        >
          <RefreshCw className="w-4 h-4 group-hover:animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-widest">Actualizar Datos</span>
        </button>
        {/* Binance Referral Card */}
        {ADS_CONFIG.enabled && ADS_CONFIG.binanceEnabled && (
          <div className="p-3 rounded-2xl bg-gradient-to-br from-[#1e2329] to-[#121418] border border-yellow-500/25 relative overflow-hidden group shadow-lg shadow-black/40">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-5 h-5 rounded-md bg-[#F0B90B] flex items-center justify-center shrink-0 shadow-sm shadow-yellow-500/30">
                <svg viewBox="0 0 120 120" className="w-3.5 h-3.5 fill-[#181a20]">
                  <path d="M60 15L74.1 29.1L49.1 54.1L35 40L60 15Z" />
                  <path d="M85.9 40.9L100 55L85.9 69.1L71.8 55L85.9 40.9Z" />
                  <path d="M60 65.9L74.1 80L60 94.1L45.9 80L60 65.9Z" />
                  <path d="M34.1 40.9L48.2 55L34.1 69.1L20 55L34.1 40.9Z" />
                  <path d="M60 40L70 50L60 60L50 50L60 40Z" />
                </svg>
              </div>
              <span className="text-[10px] font-black text-[#F0B90B] uppercase tracking-wider">Binance Bonus</span>
            </div>
            <p className="text-[9px] text-gray-400 font-medium leading-tight mb-2">
              Gana hasta <span className="text-white font-bold">$1,000 USD</span> en comisiones
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => window.open(BINANCE_REFERRAL.link, '_blank')}
                className="flex-1 py-1.5 bg-[#F0B90B] hover:bg-[#fcd535] text-black font-black text-[9px] uppercase tracking-wider rounded-lg text-center transition-all active:scale-95"
              >
                Reclamar
              </button>
              <button
                onClick={handleCopyCode}
                title="Copiar código de referido"
                className="px-2 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-lg text-[9px] font-mono font-bold transition-all active:scale-95"
              >
                {copiedCode ? '¡LISTO!' : 'CÓDIGO'}
              </button>
            </div>
          </div>
        )}

        {/* Telegram Community */}
        <button
          onClick={() => window.open('https://t.me/AnimuxOficial', '_blank')}
          className="w-full py-2 bg-[#0088cc] hover:bg-[#0099e6] text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2"
        > <Zap className="w-4 h-4 fill-current group-hover:animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest">Únete al Telegram</span>
        </button>

        <button 
          onClick={onShowTvGuide}
          className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10 hover:border-white/20 group"
        >
          <Tv className="w-4 h-4 text-gray-400 group-hover:text-white" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-300 group-hover:text-white">Ver en Smart TV</span>
        </button>

        <div className="flex flex-col items-center gap-2 px-2">
          <button
            onClick={onShowLegal}
            className="flex items-center gap-2 text-[8px] text-gray-500 hover:text-rose-500 font-black uppercase tracking-widest transition-all"
          >
            <Scale className="w-3 h-3" />
            Información Legal
          </button>
          <div className="flex flex-col items-center gap-1">
            <p className="text-[8px] text-rose-600/50 font-black uppercase tracking-widest">Animux v{version}</p>
            <p className="text-[7px] text-gray-800 font-bold uppercase tracking-[0.2em]">Sincronización Lista</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
