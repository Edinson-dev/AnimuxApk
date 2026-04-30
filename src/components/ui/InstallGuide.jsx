import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, ChevronRight, Share, PlusSquare, MoreVertical } from 'lucide-react';

export default function InstallGuide({ onClose, onInstall }) {
  const [platform, setPlatform] = useState('android');

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center p-0 md:p-6 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />

      {/* Content Container */}
      <div className="relative w-full max-w-lg bg-[#0f0f0f] border-t md:border border-white/10 rounded-t-[32px] md:rounded-[32px] overflow-hidden shadow-2xl flex flex-col">
        
        {/* Glow Effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-rose-600 rounded-full blur-sm" />

        {/* Header */}
        <div className="p-8 pb-4 flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Instala Animux</h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Disfruta la experiencia completa</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Steps Area */}
        <div className="p-8 pt-4 space-y-8">
          
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-rose-600/10 rounded-2xl flex items-center justify-center shrink-0 border border-rose-600/20">
               <Smartphone className="w-8 h-8 text-rose-500" />
            </div>
            <p className="text-sm text-gray-300 leading-relaxed font-medium">
              Instala nuestra App para tener acceso rápido, pantalla completa y notificaciones en tiempo real. **No ocupa espacio.**
            </p>
          </div>

          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Instrucciones para {platform === 'ios' ? 'iPhone' : 'Android'}</h3>
            
            {platform === 'android' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-white/[0.03] p-4 rounded-2xl border border-white/5 transition-all hover:bg-white/[0.05]">
                  <div className="w-8 h-8 bg-rose-600 rounded-xl flex items-center justify-center text-[10px] font-black text-white shrink-0">1</div>
                  <p className="text-xs text-gray-300 font-bold">Toca el botón <span className="text-rose-500">"Instalar App"</span> de abajo.</p>
                </div>
                <div className="flex items-center gap-4 bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                  <div className="w-8 h-8 bg-rose-600 rounded-xl flex items-center justify-center text-[10px] font-black text-white shrink-0">2</div>
                  <p className="text-xs text-gray-300 font-bold">Confirma en el mensaje de Google Chrome.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                  <div className="w-8 h-8 bg-rose-600 rounded-xl flex items-center justify-center text-[10px] font-black text-white shrink-0">1</div>
                  <p className="text-xs text-gray-300 font-bold flex items-center gap-2">Toca el botón Compartir <Share className="w-4 h-4 text-blue-400" /></p>
                </div>
                <div className="flex items-center gap-4 bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                  <div className="w-8 h-8 bg-rose-600 rounded-xl flex items-center justify-center text-[10px] font-black text-white shrink-0">2</div>
                  <p className="text-xs text-gray-300 font-bold flex items-center gap-2">Selecciona <PlusSquare className="w-4 h-4 text-gray-400" /> "Añadir a pantalla de inicio"</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-8 pt-0 flex flex-col gap-3">
          <button 
            onClick={() => { onInstall(); onClose(); }}
            className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-rose-600/20 active:scale-95 flex items-center justify-center gap-3"
          >
            <Download className="w-5 h-5" /> Instalar Animux Ahora
          </button>
          <button 
            onClick={onClose}
            className="w-full py-3 text-[10px] font-black text-gray-600 uppercase tracking-widest hover:text-gray-400 transition-colors"
          >
            Quizás más tarde
          </button>
        </div>
      </div>
    </div>
  );
}
