import React, { useState } from 'react';
import { 
  Home, Star, Tv, Film, Activity, Smile, Music, Zap, Heart, History, 
  Layers, Monitor, RefreshCw, Flag, MapPin, Scale, ChevronLeft, ChevronRight,
  Flame, Radio, Sparkles, Compass, Trophy, Mic, Clapperboard, Globe
} from 'lucide-react';
import { BINANCE_REFERRAL, ADS_CONFIG } from '../../config/ads';

export const ICON_MAP = {
  'inicio': { icon: Home, color: 'var(--accent-primary, #e11d48)', gradient: 'from-rose-500/20 to-rose-600/5' },
  'favoritos': { icon: Heart, color: '#ec4899', gradient: 'from-pink-500/20 to-pink-600/5' },
  'cine (vod)': { icon: Film, color: 'var(--accent-primary, #e11d48)', gradient: 'from-rose-500/20 to-rose-600/5' },
  'series (vod)': { icon: Monitor, color: '#f97316', gradient: 'from-orange-500/20 to-orange-600/5' },
  'deportes': { icon: Trophy, color: '#22c55e', gradient: 'from-emerald-500/20 to-emerald-600/5' },
  'tv abierta': { icon: Tv, color: '#38bdf8', gradient: 'from-sky-500/20 to-sky-600/5' },
  'canales nacionales': { icon: Flag, color: '#ef4444', gradient: 'from-red-500/20 to-red-600/5' },
  'entretenimiento': { icon: Sparkles, color: '#06b6d4', gradient: 'from-cyan-500/20 to-cyan-600/5' },
  'noticias': { icon: Radio, color: '#f59e0b', gradient: 'from-amber-500/20 to-amber-600/5' },
  'infantil': { icon: Smile, color: '#facc15', gradient: 'from-yellow-400/20 to-yellow-500/5' },
  'anime': { icon: Zap, color: '#a855f7', gradient: 'from-purple-500/20 to-purple-600/5' },
  'documentales': { icon: Compass, color: '#14b8a6', gradient: 'from-teal-500/20 to-teal-600/5' },
  'musica': { icon: Music, color: '#d946ef', gradient: 'from-fuchsia-500/20 to-fuchsia-600/5' },
  'maratones 24/7': { icon: RefreshCw, color: '#8b5cf6', gradient: 'from-violet-500/20 to-violet-600/5' },
  'podcasts': { icon: Mic, color: '#10b981', gradient: 'from-emerald-500/20 to-emerald-600/5' },
};

export const getCatInfo = (cat) => {
  if (!cat) return { icon: Layers, color: '#9ca3af', gradient: 'from-white/10 to-transparent' };
  const key = cat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (ICON_MAP[key]) return ICON_MAP[key];
  for (const [k, v] of Object.entries(ICON_MAP)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return { icon: Layers, color: '#9ca3af', gradient: 'from-white/10 to-transparent' };
};

export const SECTIONS = [
  {
    title: 'Tu Biblioteca',
    items: ['Inicio', 'Favoritos', 'Cine (VOD)', 'Series (VOD)']
  },
  {
    title: 'Televisión en Vivo',
    items: ['Deportes', 'TV Abierta', 'Entretenimiento', 'Noticias', 'Infantil', 'Anime', 'Documentales', 'Música']
  },
  {
    title: 'Especiales',
    items: ['Maratones 24/7', 'Podcasts']
  }
];

export default function Sidebar({ 
  categories = [], 
  activeCategory, 
  setActiveCategory, 
  counts = {}, 
  onRefresh, 
  version, 
  isKidsMode, 
  setIsKidsMode, 
  onShowLegal, 
  onShowTvGuide 
}) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleCopyCode = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(BINANCE_REFERRAL.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Agrupación de categorías por secciones
  const allAvailable = categories.length > 0 ? categories : ['Inicio', 'Favoritos', 'Cine (VOD)', 'Series (VOD)', 'Deportes', 'TV Abierta', 'Entretenimiento', 'Noticias', 'Infantil', 'Anime', 'Documentales', 'Música', 'Maratones 24/7', 'Podcasts'];

  const knownItems = new Set(SECTIONS.flatMap(s => s.items.map(i => i.toLowerCase())));
  const extraCategories = allAvailable.filter(cat => !knownItems.has(cat.toLowerCase()));

  const renderCategoryButton = (cat) => {
    const { icon: Icon, color: catColor, gradient } = getCatInfo(cat);
    const isActive = activeCategory === cat;
    const count = counts[cat];

    return (
      <button
        key={cat}
        onClick={() => setActiveCategory(cat)}
        title={isCollapsed ? `${cat} ${count ? `(${count})` : ''}` : undefined}
        className={`
          group relative flex items-center rounded-xl transition-all duration-200 cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-rose-500/60
          ${isCollapsed ? 'justify-center p-3' : 'px-3.5 py-2.5 gap-3 w-full text-left'}
          ${isActive
            ? 'bg-gradient-to-r ' + gradient + ' border border-white/10 text-white shadow-[0_4px_20px_rgba(0,0,0,0.4)]'
            : 'text-gray-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
          }
        `}
      >
        {/* Active neon accent pill */}
        {isActive && (
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full shadow-[0_0_10px_currentColor]"
            style={{ backgroundColor: catColor, color: catColor }} 
          />
        )}

        {/* Icon */}
        <div 
          className={`
            relative flex items-center justify-center rounded-lg transition-transform duration-200 shrink-0
            ${isActive ? 'scale-110' : 'group-hover:scale-105'}
          `}
        >
          <Icon
            className="w-4 h-4 transition-colors duration-200"
            style={{ color: isActive ? catColor : undefined }}
            fill={cat === 'Favoritos' && isActive ? 'currentColor' : 'none'}
          />
        </div>

        {/* Label */}
        {!isCollapsed && (
          <div className="flex-1 flex items-center justify-between min-w-0 gap-2">
            <span className={`text-[11px] font-bold uppercase tracking-wider whitespace-nowrap overflow-hidden text-ellipsis ${isActive ? 'text-white font-extrabold' : ''}`}>
              {cat}
            </span>

            {/* Badge count */}
            {count !== undefined && count > 0 && (
              <span 
                className={`
                  text-[9px] font-extrabold px-2 py-0.5 rounded-full shrink-0 tracking-tight transition-all
                  ${isActive 
                    ? 'bg-white/10 text-white font-black shadow-sm' 
                    : 'bg-white/[0.04] text-gray-500 group-hover:text-gray-300'
                  }
                `}
                style={isActive ? { color: catColor } : {}}
              >
                {count > 999 ? '999+' : count}
              </span>
            )}
          </div>
        )}
      </button>
    );
  };

  return (
    <aside 
      className={`
        hidden md:flex shrink-0 bg-[#070709]/98 backdrop-blur-2xl border-r border-white/[0.06] flex-col 
        transition-all duration-300 ease-in-out z-30 select-none overflow-hidden
        ${isCollapsed ? 'w-[72px]' : 'w-[250px] lg:w-[270px]'}
      `}
    >
      {/* Header / Collapse Trigger */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.04]">
        <div className={`flex items-center gap-2 overflow-hidden transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
          <Compass className="w-3.5 h-3.5 text-rose-500" />
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap">
            Explorar
          </span>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-gray-400 hover:text-white border border-white/[0.05] transition-all ml-auto cursor-pointer"
          title={isCollapsed ? "Expandir menú" : "Contraer menú"}
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Category list with custom scroll and structured sections */}
      <nav className="flex-1 py-3 px-2 flex flex-col gap-3 overflow-y-auto custom-scrollbar">
        {SECTIONS.map((section, idx) => (
          <div key={section.title} className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 py-1 flex items-center justify-between">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">
                  {section.title}
                </span>
              </div>
            )}
            {isCollapsed && idx > 0 && (
              <div className="my-1 border-t border-white/5 mx-2" />
            )}
            <div className="space-y-1">
              {section.items.map((catName) => {
                const match = allAvailable.find(c => c.toLowerCase() === catName.toLowerCase());
                if (!match) return null;
                return renderCategoryButton(match);
              })}
            </div>
          </div>
        ))}

        {/* Extra cloud categories if any */}
        {extraCategories.length > 0 && (
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 py-1">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">
                  Más Contenido
                </span>
              </div>
            )}
            <div className="space-y-1">
              {extraCategories.map(cat => renderCategoryButton(cat))}
            </div>
          </div>
        )}
      </nav>

      {/* Footer Controls */}
      <div className={`p-3 border-t border-white/[0.04] space-y-2.5 bg-black/40 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
        
        {/* Kids Mode Toggle */}
        <button
          onClick={() => setIsKidsMode(!isKidsMode)}
          className={`
            flex items-center rounded-xl transition-all border group cursor-pointer
            ${isCollapsed ? 'p-2.5 justify-center' : 'w-full gap-3 px-3.5 py-2.5'}
            ${isKidsMode 
              ? 'bg-yellow-400 text-black border-yellow-500 shadow-lg shadow-yellow-400/20' 
              : 'bg-white/[0.03] text-gray-400 border-white/[0.06] hover:bg-white/[0.08] hover:text-white'
            }
          `}
          title={isKidsMode ? "Desactivar Modo Kids" : "Activar Modo Kids"}
        >
          <Smile className={`w-4 h-4 shrink-0 ${isKidsMode ? 'fill-current' : 'group-hover:text-yellow-400'}`} />
          {!isCollapsed && (
            <span className="text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap">
              {isKidsMode ? 'Modo Kids Activo' : 'Modo Kids'}
            </span>
          )}
        </button>

        {/* Referral / Info */}
        {!isCollapsed && ADS_CONFIG.binanceEnabled && (
          <div 
            onClick={handleCopyCode}
            className="p-2.5 rounded-xl bg-[#f0b90b]/5 border border-[#f0b90b]/10 hover:border-[#f0b90b]/30 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-[#f0b90b] uppercase tracking-wider">Binance VIP</span>
              <span className="text-[8px] font-bold text-gray-400 group-hover:text-white transition-colors">
                {copiedCode ? '¡Copiado!' : 'Copiar'}
              </span>
            </div>
            <p className="text-[10px] font-mono text-gray-300 mt-0.5">{BINANCE_REFERRAL.code}</p>
          </div>
        )}

      </div>
    </aside>
  );
}
