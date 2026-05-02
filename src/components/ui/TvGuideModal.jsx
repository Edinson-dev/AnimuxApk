import React from 'react';
import { X, Tv, Globe, MousePointerClick, MonitorPlay, Zap } from 'lucide-react';

export default function TvGuideModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Lado Izquierdo: Visual */}
        <div className="md:w-2/5 bg-gradient-to-br from-rose-900/40 to-black p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-600/20 via-black to-black opacity-60" />
          
          <div className="relative z-10 text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-rose-600/10 rounded-2xl border border-rose-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(225,29,72,0.3)] mb-6 animate-float">
              <MonitorPlay className="w-10 h-10 text-rose-500" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-tight">
              Lleva Animux<br/>a tu TV
            </h2>
            <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">
              Sin Chromecast • Sin Cables
            </p>
          </div>
        </div>

        {/* Lado Derecho: Pasos */}
        <div className="md:w-3/5 p-6 md:p-8 space-y-6">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="space-y-5 pt-2">
            {/* Step 1 */}
            <div className="flex gap-4 items-start group">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-rose-600/20 group-hover:border-rose-500/50 transition-colors">
                <Tv className="w-5 h-5 text-gray-400 group-hover:text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">1. Enciende tu Smart TV</h3>
                <p className="text-xs text-gray-400 leading-relaxed font-medium">
                  Busca la aplicación de <strong>Navegador Web</strong> o <strong>Internet</strong> que viene instalada de fábrica en tu televisor (LG, Samsung, Android TV).
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4 items-start group">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-rose-600/20 group-hover:border-rose-500/50 transition-colors">
                <Globe className="w-5 h-5 text-gray-400 group-hover:text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">2. Escribe la dirección</h3>
                <p className="text-xs text-gray-400 leading-relaxed font-medium">
                  En la barra de direcciones de arriba, escribe exactamente: <br/>
                  <span className="inline-block mt-2 px-3 py-1.5 bg-rose-600/10 border border-rose-600/30 text-rose-400 rounded-lg text-sm font-black tracking-widest font-mono">
                    animux.site
                  </span>
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4 items-start group">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-rose-600/20 group-hover:border-rose-500/50 transition-colors">
                <MousePointerClick className="w-5 h-5 text-gray-400 group-hover:text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">3. Usa tu Control Remoto</h3>
                <p className="text-xs text-gray-400 leading-relaxed font-medium">
                  ¡No necesitas mouse! Usa las <strong>flechas</strong> de tu control para moverte por las películas y presiona el botón <strong>OK / Select</strong> para reproducir.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-4 mt-4 bg-white/5 hover:bg-rose-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest border border-white/10 hover:border-rose-500 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            ¡Entendido, a disfrutar!
          </button>

        </div>
      </div>
    </div>
  );
}
