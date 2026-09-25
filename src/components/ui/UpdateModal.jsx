import React, { useState } from 'react';
import { Sparkles, RefreshCw, X, Zap, Rocket, ShieldCheck } from 'lucide-react';

export default function UpdateModal({ onUpdate, onClose, appVersion = '1.6' }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateClick = async () => {
    setIsUpdating(true);
    try {
      await onUpdate?.();
    } catch (e) {
      console.error(e);
      window.location.reload(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-[#0c0c10]/98 border border-white/15 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden animate-slide-up">
        
        {/* Glow Ambient Top Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-rose-600 via-purple-600 to-rose-600 animate-loading-bar" />

        <div className="p-6 sm:p-8 space-y-5">
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 active:bg-white/20 rounded-full text-gray-400 hover:text-white transition-all cursor-pointer"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Icon Badge */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-600/30 to-purple-600/10 border border-rose-500/40 flex items-center justify-center shadow-[0_0_30px_var(--accent-glow,rgba(225,29,72,0.4))] shrink-0 animate-bounce-subtle">
              <Rocket className="w-7 h-7 text-rose-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-rose-600/20 border border-rose-500/30 rounded-full text-rose-400">
                  Actualización en Vivo
                </span>
                <span className="text-[9px] font-bold text-gray-400">v{appVersion}</span>
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight text-white mt-1">
                ¡Nueva Versión Lista!
              </h3>
            </div>
          </div>

          {/* Body description */}
          <p className="text-xs text-gray-300/90 leading-relaxed font-medium">
            Se ha desplegado una nueva versión de <strong>Animux</strong> con mejoras de rendimiento, soporte de mandos Smart TV y temas dinámicos.
          </p>

          {/* Highlights List */}
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3.5 space-y-2 text-[11px] text-gray-300">
            <div className="flex items-center gap-2.5">
              <Zap className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>Nuevos temas de acento visual (Paleta 🎨)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Soporte total para Smart TV & Chromecast / AirPlay</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-3.5 h-3.5 text-green-400 shrink-0" />
              <span>Canales y transmisiones 100% optimizados</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              onClick={handleUpdateClick}
              disabled={isUpdating}
              className="flex-1 flex items-center justify-center gap-2.5 py-3.5 px-6 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-rose-600/30 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
              {isUpdating ? 'Actualizando...' : 'Actualizar Ahora'}
            </button>

            <button
              onClick={onClose}
              className="px-5 py-3.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer"
            >
              Más Tarde
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
