import React, { useState, useEffect } from 'react';
import { Search, Bell, X, RefreshCw, Download, CheckCircle, WifiOff, Smile, Scale, Shield, Tv, Zap } from 'lucide-react';

export default function Header({ 
  searchQuery, 
  setSearchQuery, 
  onGoHome, 
  onInstall, 
  showInstall, 
  needRefresh, 
  updateServiceWorker,
  onForceRefresh,
  appVersion = '2.5',
  lastSync,
  isKidsMode,
  setIsKidsMode,
  isSearchOpen,
  setIsSearchOpen,
  onShowLegal,
  onShowTvGuide,
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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

  // Contar notificaciones activas
  const notifCount = needRefresh ? 1 : 0;

  // Manejar refresh con feedback visual
  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    setShowNotifications(false);
    try {
      await onForceRefresh?.();
    } finally {
      setTimeout(() => setIsRefreshing(false), 2000);
    }
  };

  // Manejar actualización de SW
  const handleSWUpdate = async () => {
    setShowNotifications(false);
    try {
      if (updateServiceWorker) {
        await updateServiceWorker(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      // Limpiamos caché para forzar la carga de todo nuevo
      localStorage.removeItem('animux_last_fetch');
      window.location.reload(true);
    }
  };

  // Cerrar panel al hacer clic fuera (usando ref para evitar conflictos)
  const panelRef = React.useRef(null);
  useEffect(() => {
    if (!showNotifications) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    // Pequeño delay para no cerrar inmediatamente al abrir
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
    };
  }, [showNotifications]);

  return (
    <header className="fixed top-0 left-0 right-0 z-[80] bg-black/95 backdrop-blur-md border-b border-white/[0.05] py-3">
      <div className="max-w-[1920px] mx-auto px-4 md:px-6 flex items-center gap-4">

        {/* Logo */}
        <div onClick={onGoHome} className="flex items-center gap-3 cursor-pointer group shrink-0">
          <div className="w-8 h-8 md:w-9 md:h-9 bg-black rounded-xl flex items-center justify-center shadow-xl border border-white/10 group-hover:border-rose-500 transition-all duration-300 overflow-hidden">
            <img src="/icon-192.png" alt="Animux" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-black tracking-tighter text-white uppercase hidden sm:block leading-none">
              Animux
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[7px] md:text-[8px] font-black text-rose-500 uppercase tracking-widest opacity-80 leading-none">
                v{appVersion}
              </span>
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-500/10 border border-green-500/20 rounded-sm" title="Conexión Segura Verificada">
                <Shield className="w-2 h-2 text-green-500" />
                <span className="text-[6px] font-black text-green-500 uppercase tracking-widest hidden md:inline">Seguro</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search bar — desktop */}
        <div className="flex-1 max-w-lg hidden md:block relative">
          <div className="flex items-center bg-white/[0.05] border border-white/[0.07] focus-within:border-rose-600/40 focus-within:bg-white/[0.08] rounded-full py-2 px-5 transition-all gap-2">
            <Search className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            <input
              type="text"
              placeholder="Buscar canales, películas, series..."
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200) /* Delay to allow click on chips */}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-[11px] font-medium text-white w-full placeholder:text-gray-600"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Suggestions Chips */}
          {isSearchFocused && !searchQuery && (
            <div className="absolute top-12 left-0 right-0 p-4 bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl z-[90] animate-slide-up">
              <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Sugerencias rápidas</h4>
              <div className="flex flex-wrap gap-2">
                {['Fútbol', 'Cine', 'Infantil', 'Noticias', 'Acción', 'Premium'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSearchQuery(tag)}
                    className="px-3 py-1.5 bg-white/5 hover:bg-rose-600/20 border border-white/5 hover:border-rose-600/40 rounded-full text-[10px] font-bold text-gray-400 hover:text-rose-400 transition-all"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 md:hidden" />

        {/* Right controls */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Botón TV Guide (Icono en móvil, con texto en PC) */}
          <button
            onClick={onShowTvGuide}
            title="Cómo ver en Smart TV"
            className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 sm:bg-white/5 sm:hover:bg-white/10 text-gray-400 hover:text-white rounded-full sm:border sm:border-white/10 transition-all text-[10px] font-black uppercase tracking-widest"
          >
            <Tv className="w-5 h-5 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">Ver en TV</span>
          </button>

          {/* Botón Modo Kids */}
          <button
            onClick={() => setIsKidsMode(!isKidsMode)}
            title={isKidsMode ? "Desactivar Modo Kids" : "Activar Modo Kids"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all text-[10px] font-black uppercase tracking-widest ${
              isKidsMode 
                ? 'bg-yellow-400 text-black border-yellow-500 shadow-lg shadow-yellow-400/20' 
                : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
            }`}
          >
            <Smile className={`w-3.5 h-3.5 ${isKidsMode ? 'fill-current' : ''}`} />
            <span className="hidden lg:inline">{isKidsMode ? 'Modo Kids On' : 'Modo Kids'}</span>
          </button>

          {/* Botón Instalar PWA */}
          {showInstall && (
            <button
              onClick={onInstall}
              title="Instalar App"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded-full border border-rose-600/30 transition-all text-[10px] font-black uppercase tracking-widest"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Instalar</span>
            </button>
          )}

          {/* Botón Actualizar Datos (RefreshCw) */}
          <button
            onClick={handleForceRefresh}
            disabled={isRefreshing}
            className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-full transition-all relative group"
            title="Actualizar datos"
          >
            <RefreshCw className={`w-5 h-5 transition-transform ${isRefreshing ? 'animate-spin text-rose-500' : 'group-hover:rotate-180 duration-500'}`} />
          </button>

          {/* Botón Campanita (Notificaciones) */}
          <div className="relative" ref={panelRef}>
            <button
              id="notif-btn"
              onClick={() => setShowNotifications(v => !v)}
              className={`p-2 rounded-full transition-all relative group ${showNotifications ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              title="Notificaciones"
            >
              <Bell className={`w-5 h-5 transition-transform ${needRefresh ? 'text-rose-400 animate-pulse' : 'group-hover:rotate-12'}`} />
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
                className="absolute right-0 top-12 w-80 bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-[100]"
              >
                {/* Header del panel */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                  <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Centro de Control</h3>
                  <button onClick={() => setShowNotifications(false)} className="text-gray-600 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 space-y-2">

                  {/* Card: versión actual */}
                  <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-8 h-8 bg-rose-600/10 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-rose-500 text-[10px] font-black">v</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black text-white">Versión {appVersion}</p>
                      <p className="text-[10px] text-gray-500">Último sync: {formatLastSync(lastSync)}</p>
                    </div>
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  </div>

                  {/* Card: Actualización de SW disponible */}
                  {needRefresh && (
                    <div className="bg-rose-600/10 border border-rose-600/20 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <WifiOff className="w-4 h-4 text-rose-400" />
                        <p className="text-[11px] font-black text-rose-300">Nueva versión disponible</p>
                      </div>
                      <p className="text-[10px] text-gray-400 mb-3">Hay una actualización de la app lista para instalarse.</p>
                      <button
                        onClick={handleSWUpdate}
                        className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
                      >
                        Aplicar Actualización
                      </button>
                    </div>
                  )}

                  {/* Card: Telegram Community */}
                  <div className="bg-[#0088cc]/10 border border-[#0088cc]/20 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-[#0088cc] fill-current" />
                      <p className="text-[11px] font-black text-[#0088cc] uppercase tracking-widest">Comunidad Telegram</p>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-3">Únete para recibir noticias, pedir contenido y reportar fallos.</p>
                    <button
                      onClick={() => window.open('https://t.me/AnimuxOficial', '_blank')}
                      className="w-full py-2 bg-[#0088cc] hover:bg-[#0099e6] text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      Unirme al Grupo
                    </button>
                  </div>

                  {/* Botón actualizar datos */}
                  <button
                    onClick={handleForceRefresh}
                    disabled={isRefreshing}
                    className="w-full flex items-center gap-3 p-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-xl transition-all group"
                  >
                    <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                      <RefreshCw className={`w-4 h-4 text-gray-400 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] font-black text-white">Actualizar datos</p>
                      <p className="text-[10px] text-gray-500">Recarga canales y películas desde Firebase</p>
                    </div>
                  </button>

                  {/* Botón instalar si disponible */}
                  {showInstall && (
                    <button
                      onClick={() => { onInstall?.(); setShowNotifications(false); }}
                      className="w-full flex items-center gap-3 p-3 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-600/20 rounded-xl transition-all"
                    >
                      <div className="w-8 h-8 bg-rose-600/20 rounded-lg flex items-center justify-center shrink-0">
                        <Download className="w-4 h-4 text-rose-400" />
                      </div>
                      <div className="text-left">
                        <p className="text-[11px] font-black text-rose-300">Instalar Animux</p>
                        <p className="text-[10px] text-gray-500">Añadir a pantalla de inicio</p>
                      </div>
                    </button>
                  )}
                </div>

                {/* Footer del panel */}
                <div className="px-4 py-3 border-t border-white/5 bg-black/30 space-y-2">
                  <button 
                    onClick={() => { onShowLegal(); setShowNotifications(false); }}
                    className="w-full flex items-center justify-center gap-2 py-2 text-[9px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-500/10 rounded-lg transition-all"
                  >
                    <Scale className="w-3 h-3" />
                    Términos y Privacidad
                  </button>
                  <p className="text-[9px] text-gray-600 text-center font-medium">
                    Animux v{appVersion} • {new Date().getFullYear()}
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
      {/* Mobile Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[110] bg-[#050505] animate-fade-in flex flex-col md:hidden">
          <div className="p-4 border-b border-white/5 flex items-center gap-3">
            <button onClick={() => setIsSearchOpen(false)} className="p-2 text-gray-400">
              <X className="w-6 h-6" />
            </button>
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500" />
              <input
                autoFocus
                type="text"
                placeholder="Buscar en Animux..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-white outline-none focus:border-rose-500/50"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {!searchQuery && (
              <div className="space-y-4">
                <h4 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em]">Sugerencias Populares</h4>
                <div className="flex flex-wrap gap-2">
                  {['Deportes', 'Cine', 'Infantil', 'Música', 'Nuevos', 'Series'].map(tag => (
                    <button
                      key={tag}
                      onClick={() => { setSearchQuery(tag); setIsSearchOpen(false); }}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-black text-gray-400 uppercase tracking-widest"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {searchQuery && (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                 <Search className="w-12 h-12 text-rose-600 mb-4 animate-pulse" />
                 <p className="text-sm font-black text-white uppercase tracking-widest">Buscando "{searchQuery}"</p>
                 <button onClick={() => setIsSearchOpen(false)} className="mt-6 px-8 py-3 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Ver Resultados</button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
