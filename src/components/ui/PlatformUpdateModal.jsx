import React, { useState } from 'react';
import { 
  Rocket, RefreshCw, X, Zap, ShieldCheck, Film, 
  Sparkles, CheckCircle2, ArrowRight 
} from 'lucide-react';

const ICON_MAP = {
  Zap: Zap,
  Film: Film,
  ShieldCheck: ShieldCheck,
  Sparkles: Sparkles,
  Rocket: Rocket,
};

export default function PlatformUpdateModal({
  noticeData,
  onApply,
  onClose,
  appVersion = '1.6'
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!noticeData) return null;

  const isLive = noticeData.type === 'live' || noticeData.type === 'sw_refresh';
  const isInstalled = noticeData.type === 'installed';

  const handleUpdateClick = async () => {
    setIsUpdating(true);
    await onApply?.();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      {/* Backdrop con desenfoque de cristal */}
      <div 
        className="absolute inset-0 bg-black/85 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Card del Pop-up */}
      <div className="relative w-full max-w-lg bg-[#0c0c12]/98 border border-rose-500/30 rounded-[2.5rem] shadow-[0_25px_80px_rgba(225,29,72,0.25)] overflow-hidden animate-slide-up">
        
        {/* Barra superior con gradiente neón animado */}
        <div className="h-1.5 w-full bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 animate-loading-bar" />

        {/* Resplandor ambiental superior */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-rose-600/15 blur-[60px] pointer-events-none" />

        <div className="relative p-6 sm:p-8 space-y-6">
          {/* Botón de cierre */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2.5 bg-white/5 hover:bg-white/10 active:bg-white/20 rounded-full text-gray-400 hover:text-white transition-all cursor-pointer"
            title="Cerrar aviso"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Encabezado: Badge + Título */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-rose-600/30 to-purple-600/10 border border-rose-500/40 flex items-center justify-center shadow-[0_0_35px_rgba(225,29,72,0.4)] shrink-0 animate-bounce-subtle">
              {isInstalled ? (
                <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400" />
              ) : (
                <Rocket className="w-7 h-7 sm:w-8 sm:h-8 text-rose-500" />
              )}
            </div>

            <div className="space-y-1.5 flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Badge pulsante */}
                <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-rose-600/20 border border-rose-500/40 rounded-full text-rose-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
                  {noticeData.badge || 'EN ESTOS MOMENTOS'}
                </span>

                <span className="text-[10px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                  v{noticeData.version || appVersion}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white leading-tight">
                {noticeData.title || '¡Actualización de la Plataforma!'}
              </h3>
            </div>
          </div>

          {/* Mensaje descriptivo */}
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-medium bg-white/[0.02] p-3.5 rounded-2xl border border-white/5">
            {noticeData.message}
          </p>

          {/* Lista de mejoras destacadas */}
          <div className="space-y-2">
            <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-1">
              {isInstalled ? 'Novedades aplicadas:' : 'Mejoras en proceso:'}
            </div>

            <div className="grid grid-cols-1 gap-2">
              {(noticeData.highlights || []).map((item, idx) => {
                const IconComponent = (typeof item === 'object' && ICON_MAP[item.icon]) ? ICON_MAP[item.icon] : CheckCircle2;
                const text = typeof item === 'object' ? item.text : item;

                return (
                  <div 
                    key={idx}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                      <IconComponent className="w-3.5 h-3.5 text-rose-400" />
                    </div>
                    <span className="text-[11px] sm:text-xs text-gray-200 font-medium">
                      {text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleUpdateClick}
              disabled={isUpdating}
              className="flex-1 flex items-center justify-center gap-2.5 py-4 px-6 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest shadow-xl shadow-rose-600/30 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isInstalled ? (
                <CheckCircle2 className="w-4 h-4 text-white" />
              ) : (
                <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
              )}
              <span>
                {isUpdating ? 'Cargando actualización...' : isInstalled ? '¡Entendido, a disfrutar!' : 'Actualizar y Cargar Ahora'}
              </span>
              {!isUpdating && <ArrowRight className="w-4 h-4 opacity-75" />}
            </button>

            {isLive && (
              <button
                onClick={onClose}
                className="px-5 py-4 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer text-center"
              >
                Más tarde
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
