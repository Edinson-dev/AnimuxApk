import React, { useState, useEffect } from 'react';
import { Search, Bell, X, RefreshCw, Download, CheckCircle, WifiOff } from 'lucide-react';

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
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
  const handleSWUpdate = () => {
    setShowNotifications(false);
    if (updateServiceWorker) {
      updateServiceWorker(true);
    } else {
      window.location.reload();
    }
  };

  // Cerrar panel al hacer clic fuera
  useEffect(() => {
    if (!showNotifications) return;
    const handler = (e) => {
      if (!e.target.closest('#notif-panel') && !e.target.closest('#notif-btn')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifications]);

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

        <div className="flex-1 md:hidden" />

        {/* Right controls */}
        <div className="flex items-center gap-2 shrink-0">

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
          <div className="relative">
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
                <div className="px-4 py-2 border-t border-white/5 bg-black/30">
                  <p className="text-[9px] text-gray-600 text-center font-medium">
                    Animux v{appVersion} • {new Date().getFullYear()}
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
