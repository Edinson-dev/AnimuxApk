import React from 'react';
import { X, Heart, HeartHandshake, Star, ExternalLink } from 'lucide-react';

const PAYPAL_URL = 'https://www.paypal.com/donate/?business=ASFZPPBP7DN7L&no_recurring=0&item_name=Mantener+servidores+del+proyecto.&currency_code=USD';

const AMOUNTS = [
  { value: 1, label: '$1', emoji: '☕' },
  { value: 3, label: '$3', emoji: '🍕' },
  { value: 5, label: '$5', emoji: '⭐' },
  { value: 10, label: '$10', emoji: '🚀' },
];

export default function DonateModal({ onClose }) {
  const handleDonate = (amount) => {
    const url = amount 
      ? `${PAYPAL_URL}&amount=${amount}&item_name=Apoyo+a+Animux`
      : PAYPAL_URL;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_0_80px_rgba(225,29,72,0.1)] animate-slide-up">
        
        {/* Glow superior */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-rose-600/15 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-rose-600/10 blur-[80px] rounded-full pointer-events-none" />

        {/* Close */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-2 hover:bg-white/5 rounded-full text-white/30 hover:text-white transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative p-8 flex flex-col items-center text-center gap-6">
          
          {/* Icono animado */}
          <div className="relative">
            <div className="absolute inset-0 bg-rose-600/20 rounded-[1.8rem] blur-xl animate-pulse" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-rose-600 to-rose-800 rounded-[1.8rem] flex items-center justify-center shadow-2xl shadow-rose-600/30">
              <HeartHandshake className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Texto */}
          <div className="space-y-3">
            <h3 className="text-2xl font-black uppercase tracking-tighter text-white">
              Apoya el Proyecto
            </h3>
            <p className="text-[11px] font-medium text-gray-400 leading-relaxed max-w-[280px]">
              Tu aporte nos ayuda a mantener los servidores activos y seguir mejorando Animux para todos. Cada contribución marca la diferencia.
            </p>
          </div>

          {/* Montos sugeridos */}
          <div className="grid grid-cols-4 gap-2 w-full">
            {AMOUNTS.map(({ value, label, emoji }) => (
              <button
                key={value}
                onClick={() => handleDonate(value)}
                className="flex flex-col items-center gap-1.5 py-3 bg-white/[0.03] hover:bg-rose-600/10 border border-white/5 hover:border-rose-600/30 rounded-2xl transition-all active:scale-95 group"
              >
                <span className="text-xl group-hover:scale-110 transition-transform">{emoji}</span>
                <span className="text-[11px] font-black text-white/80 group-hover:text-rose-400 transition-colors">{label}</span>
              </button>
            ))}
          </div>

          {/* Botón principal */}
          <button
            onClick={() => handleDonate(null)}
            className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-rose-600/20 flex items-center justify-center gap-3"
          >
            <Heart className="w-4 h-4 fill-current" />
            Apoyar con PayPal
            <ExternalLink className="w-3 h-3 opacity-50" />
          </button>

          {/* Nota pequeña */}
          <div className="flex items-center gap-2 pt-1">
            <Star className="w-3 h-3 text-yellow-500 fill-current" />
            <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">
              Cada aporte cuenta • 100% voluntario
            </p>
            <Star className="w-3 h-3 text-yellow-500 fill-current" />
          </div>
        </div>
      </div>
    </div>
  );
}
