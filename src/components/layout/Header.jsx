import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, X, RefreshCw, Download, CheckCircle, WifiOff, Smile, Scale, Shield, Tv, Zap, Palette, Flame, Sparkles, Film, Trophy, Compass, Globe } from 'lucide-react';
import { THEMES, getActiveTheme, applyTheme } from '../../utils/theme';
import { useTranslation } from '../../utils/i18n.jsx';

export default function Header({ 
  searchQuery, 
  setSearchQuery, 
  onGoHome, 
  onInstall, 
  showInstall, 
  needRefresh, 
  updateServiceWorker,
  onForceRefresh,
  appVersion = '1.6',
  lastSync,
  isKidsMode,
  setIsKidsMode,
  isSearchOpen,
  setIsSearchOpen,
  onShowLegal,
  onShowTvGuide,
}) {
  const { t, currentLang, setLanguage, languages } = useTranslation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(getActiveTheme());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const panelRef = useRef(null);

  const moods = [
    { label: t('mood_movies'), query: 'Cine', gradient: 'from-rose-600/30 to-pink-600/10', border: 'border-rose-500/30' },
    { label: t('mood_action'), query: 'Acción', gradient: 'from-amber-600/30 to-orange-600/10', border: 'border-amber-500/30' },
    { label: t('mood_sports'), query: 'Deportes', gradient: 'from-emerald-600/30 to-teal-600/10', border: 'border-emerald-500/30' },
    { label: t('mood_comedy'), query: 'Comedia', gradient: 'from-yellow-500/30 to-amber-600/10', border: 'border-yellow-500/30' },
    { label: t('mood_series'), query: 'Series', gradient: 'from-purple-600/30 to-indigo-600/10', border: 'border-purple-500/30' },
    { label: t('mood_docs'), query: 'Documentales', gradient: 'from-cyan-600/30 to-blue-600/10', border: 'border-cyan-500/30' },
    { label: t('mood_kids'), query: 'Infantil', gradient: 'from-pink-500/30 to-yellow-500/10', border: 'border-pink-500/30' },
    { label: t('mood_music'), query: 'Música', gradient: 'from-violet-600/30 to-fuchsia-600/10', border: 'border-violet-500/30' },
  ];

  // Formatea la hora del último sync
  const formatLastSync = (ts) => {
    if (!ts) return 'Nunca';
    const d = new Date(parseInt(ts));
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Hace un momento';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `Hace ${diffH}h`;
    return d.toLocaleDateString('es', { day: '2-digit', month: '2-digit' });
  };

  const notifCount = needRefresh ? 1 : 0;

  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    setShowNotifications(false);
    try {
      await onForceRefresh?.();
    } finally {
      setTimeout(() => setIsRefreshing(false), 2000);
    }
  };

  const handleSWUpdate = async () => {
    setShowNotifications(false);
    try {
      if (updateServiceWorker) {
        await updateServiceWorker(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem('animux_last_fetch');
      window.location.reload(true);
    }
  };

  const handleSelectTheme = (themeId) => {
    const updated = applyTheme(themeId);
    setCurrentTheme(updated);
    setShowThemeModal(false);
  };

  // Close panels on click outside
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (themeRef.current && !themeRef.current.contains(e.target)) {
        setShowThemeModal(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[80] bg-[#070709]/98 backdrop-blur-2xl border-b border-white/[0.06] safe-area-top">
        <div className="max-w-[1920px] mx-auto px-3.5 sm:px-6 md:px-8 h-14 md:h-16 flex items-center justify-between gap-3">

        {/* Logo */}
        <div onClick={onGoHome} className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group shrink-0 select-none">
          <div className="w-8 h-8 md:w-9 md:h-9 bg-black rounded-xl flex items-center justify-center shadow-2xl border border-white/10 group-hover:border-rose-500 transition-all duration-300 overflow-hidden shrink-0">
            <img src="/icon-192.png" alt="Animux" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-2xl font-black tracking-tighter text-white uppercase leading-none">
                Animux
              </h1>
              <span className="text-[7px] md:text-[8px] font-black text-rose-500 uppercase tracking-widest px-1.5 py-0.5 bg-rose-500/10 rounded-sm leading-none">
                v{appVersion}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 mt-0.5">
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-500/10 border border-green-500/20 rounded-sm" title="Conexión Segura Verificada">
                <Shield className="w-2 h-2 text-green-500" />
                <span className="text-[6px] font-black text-green-500 uppercase tracking-widest">Seguro</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search bar — desktop with Moods & suggestions */}
        <div className="flex-1 max-w-lg hidden md:block relative">
          <div className="flex items-center bg-white/[0.05] border border-white/[0.08] focus-within:border-rose-500/50 focus-within:bg-white/[0.08] rounded-full py-2 px-5 transition-all gap-2 shadow-inner">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder={t('search_placeholder')}
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-[11px] font-medium text-white w-full placeholder:text-gray-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Moods & Suggestions Overlay */}
          {isSearchFocused && !searchQuery && (
            <div className="absolute top-12 left-0 right-0 p-4 bg-[#0c0c0f]/98 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-[90] animate-slide-up space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-rose-500" />
                  {t('what_to_watch')}
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {moods.map((mood) => (
                  <button
                    key={mood.label}
                    onClick={() => setSearchQuery(mood.query)}
                    className={`p-2 rounded-xl bg-gradient-to-r ${mood.gradient} border ${mood.border} text-left text-[10px] font-extrabold text-gray-200 hover:text-white hover:scale-[1.02] transition-all cursor-pointer`}
                  >
                    {mood.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

          {/* Language Switcher Button */}
          <button
            onClick={() => setShowLanguageModal(true)}
            title={t('language_selector')}
            className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 text-gray-300 hover:text-white bg-white/5 active:bg-white/10 rounded-full border border-white/10 transition-all cursor-pointer group"
          >
            <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 group-hover:rotate-45 transition-transform duration-300" />
            <span className="text-[9px] font-black uppercase tracking-wider text-gray-300">
              {currentLang.toUpperCase()}
            </span>
          </button>

          {/* Theme Switcher Button */}
          <button
            onClick={() => setShowThemeModal(true)}
            title={t('accent_themes')}
            className="p-2 text-gray-300 hover:text-white bg-white/5 active:bg-white/10 rounded-full border border-white/10 transition-all cursor-pointer"
          >
            <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500" />
          </button>

          {/* Botón TV Guide (visible on tablet/desktop) */}
          <button
            onClick={onShowTvGuide}
            title={t('tv_guide')}
            className="hidden sm:flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-full border border-white/10 transition-all text-[10px] font-black uppercase tracking-widest cursor-pointer"
          >
            <Tv className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{t('tv_guide')}</span>
          </button>

          {/* Botón Modo Kids */}
          <button
            onClick={() => setIsKidsMode(!isKidsMode)}
            title={isKidsMode ? t('kids_mode_off') : t('kids_mode_on')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 rounded-full border transition-all text-[10px] font-black uppercase tracking-widest cursor-pointer ${
              isKidsMode 
                ? 'bg-yellow-400 text-black border-yellow-500 shadow-lg shadow-yellow-400/20' 
                : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
            }`}
          >
            <Smile className={`w-3.5 h-3.5 ${isKidsMode ? 'fill-current' : ''}`} />
            <span className="hidden lg:inline">{isKidsMode ? 'Kids On' : 'Kids'}</span>
          </button>

          {/* Botón Instalar PWA */}
          {showInstall && (
            <button
              onClick={onInstall}
              title="Instalar App"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded-full border border-rose-600/30 transition-all text-[10px] font-black uppercase tracking-widest cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar</span>
            </button>
          )}

          {/* Botón Actualizar Datos */}
          <button
            onClick={handleForceRefresh}
            disabled={isRefreshing}
            className="hidden sm:flex p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-full transition-all relative group cursor-pointer"
            title={t('refresh_data')}
          >
            <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${isRefreshing ? 'animate-spin text-rose-500' : 'group-hover:rotate-180 duration-500'}`} />
          </button>

          {/* Botón Campanita */}
          <div className="relative" ref={panelRef}>
            <button
              id="notif-btn"
              onClick={() => setShowNotifications(v => !v)}
              className={`p-2 rounded-full transition-all relative group cursor-pointer ${showNotifications ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              title="Notificaciones"
            >
              <Bell className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${needRefresh ? 'text-rose-400 animate-pulse' : 'group-hover:rotate-12'}`} />
              {notifCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 rounded-full text-[8px] font-black text-white flex items-center justify-center animate-bounce">
                  {notifCount}
                </span>
              )}
            </button>

            {/* Panel de Notificaciones */}
            {showNotifications && (
              <div
                id="notif-panel"
                className="absolute right-0 top-12 w-80 bg-[#0f0f13]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-[100] animate-slide-up"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                  <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">{t('control_center')}</h3>
                  <button onClick={() => setShowNotifications(false)} className="text-gray-500 hover:text-white transition-colors cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 space-y-2">
                  <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-8 h-8 bg-rose-600/10 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-rose-500 text-[10px] font-black">v</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black text-white">{t('up_to_date')} (v{appVersion})</p>
                      <p className="text-[10px] text-gray-500">{t('last_sync')}: {formatLastSync(lastSync)}</p>
                    </div>
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  </div>

                  {needRefresh && (
                    <div className="bg-rose-600/10 border border-rose-600/20 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <WifiOff className="w-4 h-4 text-rose-400" />
                        <p className="text-[11px] font-black text-rose-300">{t('new_version_available')}</p>
                      </div>
                      <p className="text-[10px] text-gray-400 mb-3">{t('new_version_desc')}</p>
                      <button
                        onClick={handleSWUpdate}
                        className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer"
                      >
                        {t('update_now')}
                      </button>
                    </div>
                  )}

                  <div className="bg-[#0088cc]/10 border border-[#0088cc]/20 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-[#0088cc] fill-current" />
                      <p className="text-[11px] font-black text-[#0088cc] uppercase tracking-widest">{t('telegram_group')}</p>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-3">{t('telegram_desc')}</p>
                    <button
                      onClick={() => window.open('https://t.me/animux_oficial', '_blank')}
                      className="w-full py-2 bg-[#0088cc] hover:bg-[#0099e6] text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {t('join_telegram')}
                    </button>
                  </div>

                  <button
                    onClick={handleForceRefresh}
                    disabled={isRefreshing}
                    className="w-full flex items-center gap-3 p-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-xl transition-all group cursor-pointer"
                  >
                    <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                      <RefreshCw className={`w-4 h-4 text-gray-400 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] font-black text-white">{t('refresh_data')}</p>
                      <p className="text-[10px] text-gray-500">{t('reloading_data')}</p>
                    </div>
                  </button>
                </div>

                <div className="px-4 py-3 border-t border-white/5 bg-black/30 space-y-2">
                  <button 
                    onClick={() => { onShowLegal(); setShowNotifications(false); }}
                    className="w-full flex items-center justify-center gap-2 py-2 text-[9px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                  >
                    <Scale className="w-3 h-3" />
                    {t('terms_privacy')}
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      </header>

      {/* Language Selector Modal (100% Solid Background, clean flags & regions) */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div 
            className="absolute inset-0"
            onClick={() => setShowLanguageModal(false)}
          />
          <div className="relative w-full max-w-xs bg-[#111116] border border-white/20 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.98)] p-5 z-10 animate-slide-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-black text-white uppercase tracking-wider">{t('language_selector')}</span>
              </div>
              <button 
                onClick={() => setShowLanguageModal(false)} 
                className="p-1 rounded-full text-gray-400 hover:text-white bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {languages.map((l) => {
                const isSelected = currentLang === l.code;
                return (
                  <button
                    key={l.code}
                    onClick={() => { setLanguage(l.code); setShowLanguageModal(false); }}
                    className={`w-full p-3.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-rose-600/20 border-rose-500 text-white shadow-lg shadow-rose-600/20 font-black'
                        : 'bg-[#181820] border-white/10 hover:border-white/25 text-gray-200 active:scale-95'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl leading-none">{l.flag}</span>
                      <div className="text-left">
                        <p className="text-xs font-bold text-white">{l.name}</p>
                        <p className="text-[9px] text-gray-400">{l.region}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(225,29,72,1)]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Theme Selector Modal (100% Solid Background, separated from header containing block) */}
      {showThemeModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div 
            className="absolute inset-0"
            onClick={() => setShowThemeModal(false)}
          />
          <div className="relative w-full max-w-xs bg-[#111116] border border-white/20 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.98)] p-5 z-10 animate-slide-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-black text-white uppercase tracking-wider">{t('accent_themes')}</span>
              </div>
              <button 
                onClick={() => setShowThemeModal(false)} 
                className="p-1 rounded-full text-gray-400 hover:text-white bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTheme(t.id)}
                  className={`p-3 rounded-2xl border flex items-center gap-2.5 text-left transition-all cursor-pointer ${
                    currentTheme.id === t.id
                      ? 'bg-white/15 border-white/40 shadow-lg shadow-black/80 scale-[1.02]'
                      : 'bg-[#181820] border-white/10 hover:border-white/25 active:scale-95'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full shrink-0 shadow-md ring-1 ring-white/20" style={{ backgroundColor: t.primary }} />
                  <span className="text-[10px] font-bold text-gray-200 truncate">{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Search Overlay (100% Solid Black Background - Zero bleed-through) */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[450] bg-[#000000] w-full h-[100dvh] flex flex-col overflow-hidden animate-fade-in md:hidden">
          {/* Header with search input */}
          <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-[#0c0c10] shrink-0 safe-area-top">
            <button 
              onClick={() => setIsSearchOpen(false)} 
              className="p-2 -ml-1 text-gray-300 hover:text-white bg-white/10 active:bg-white/20 rounded-full border border-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500" />
              <input
                autoFocus
                type="text"
                placeholder={t('search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsSearchOpen(false);
                  }
                }}
                className="w-full bg-[#181820] border border-white/20 focus:border-rose-500 rounded-2xl py-3 pl-12 pr-10 text-sm font-bold text-white outline-none placeholder:text-gray-500"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')} 
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          {/* Scrollable mood & result area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar pb-32 bg-[#000000]">
            {!searchQuery && (
              <div className="space-y-4">
                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                  {t('what_to_watch')}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {moods.map((mood) => (
                    <button
                      key={mood.label}
                      onClick={() => { setSearchQuery(mood.query); setIsSearchOpen(false); }}
                      className={`p-4 rounded-2xl bg-gradient-to-r ${mood.gradient} border ${mood.border} text-left text-xs font-black text-white active:scale-95 transition-all shadow-md`}
                    >
                      {mood.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {searchQuery && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                 <Search className="w-12 h-12 text-rose-500 mb-3 animate-pulse" />
                 <p className="text-base font-black text-white uppercase tracking-wider">{t('searching_for')} "{searchQuery}"</p>
                 <p className="text-xs text-gray-400 mt-1">{t('searching_desc')}</p>
                 <button 
                   onClick={() => setIsSearchOpen(false)} 
                   className="mt-6 px-8 py-3.5 bg-gradient-to-r from-rose-600 to-rose-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-rose-600/30 active:scale-95 cursor-pointer"
                 >
                   {t('see_results')}
                 </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
