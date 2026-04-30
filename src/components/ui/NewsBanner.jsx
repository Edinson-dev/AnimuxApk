import React, { useState, useEffect } from 'react';
import { Megaphone, X, ArrowRight } from 'lucide-react';

export default function NewsBanner() {
  const [isVisible, setIsVisible] = useState(false);
  
  // ID de la noticia actual - si lo cambias, el banner volverá a aparecer para todos
const NEWS_ID = 'news_v2_test';
  const NEWS_TEXT = "🔥 ¡Nuevas películas y canales de deportes agregados! Disfruta de la mejor calidad en Animux.";

  useEffect(() => {
    const isClosed = localStorage.getItem(`banner_closed_${NEWS_ID}`);
    if (!isClosed) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(`banner_closed_${NEWS_ID}`, 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      {/* Overlay con blur profundo */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={handleClose} />
      
      {/* Caja del Pop-up */}
      <div className="relative w-full max-w-sm bg-[#090909] border border-rose-600/20 rounded-[2.5rem] overflow-hidden shadow-[0_0_80px_rgba(225,29,72,0.15)] animate-scale-up">
        
        {/* Adorno superior (Gradiente Rose) */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-rose-600/10 to-transparent pointer-events-none" />

        <div className="relative p-8 flex flex-col items-center text-center gap-6">
          {/* Icono Flotante */}
          <div className="w-20 h-20 bg-rose-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-rose-600/40 rotate-12 animate-float">
            <Megaphone className="w-10 h-10 text-white -rotate-12" />
          </div>

          <div className="space-y-3">
            <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-white">¡Novedades en Animux!</h3>
            <p className="text-[11px] font-bold text-gray-300 leading-relaxed uppercase tracking-widest px-2">
              {NEWS_TEXT}
            </p>
          </div>

          <button 
            onClick={handleClose}
            className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-500 transition-all active:scale-95 shadow-xl shadow-rose-600/20"
          >
            Entendido
          </button>
        </div>

        {/* Botón X superior */}
        <button 
          onClick={handleClose}
          className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full text-white/30 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
