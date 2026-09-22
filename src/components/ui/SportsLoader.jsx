import React from 'react';
import { Zap } from 'lucide-react';

export default function SportsLoader({ channel, className = "w-20 h-20" }) {
  const logo = channel?.logo;

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      {/* Glow ambiental dinámico con colores de Animux y estadio */}
      <div className="absolute inset-0 bg-rose-600/30 rounded-full blur-2xl animate-pulse pointer-events-none" />
      <div className="absolute -inset-2 bg-emerald-500/15 rounded-full blur-3xl animate-pulse pointer-events-none" />

      {/* Anillos orbitales tecnológicos estilo HUD */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Anillo exterior punteado de radar */}
        <div className="absolute inset-0 rounded-full border border-dashed border-rose-500/40 animate-spin-slow" />
        
        {/* Anillo láser interior con giro inverso */}
        <div className="absolute inset-1.5 rounded-full border-2 border-t-rose-500 border-r-transparent border-b-emerald-400/70 border-l-transparent animate-spin-reverse" />

        {/* Tarjeta central OLED Glass con logo del canal o ícono de señal deportiva */}
        <div className="relative w-[75%] h-[75%] rounded-2xl bg-black/70 backdrop-blur-md border border-white/10 shadow-[0_0_25px_rgba(225,29,72,0.3)] flex items-center justify-center overflow-hidden p-2.5">
          {logo ? (
            <img 
              src={logo} 
              alt={channel?.name || "Canal Deportivo"} 
              className="w-full h-full object-contain filter drop-shadow-[0_2px_12px_rgba(225,29,72,0.5)] transition-all"
              onError={(e) => { 
                e.currentTarget.style.display = 'none'; 
              }}
            />
          ) : (
            <div className="flex items-center justify-center text-rose-500">
              <Zap className="w-7 h-7 drop-shadow-[0_0_12px_rgba(225,29,72,0.8)] animate-pulse" />
            </div>
          )}
        </div>

        {/* Baliza satelital EN VIVO */}
        <div className="absolute -top-1 -right-1 flex items-center justify-center">
          <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping absolute opacity-75" />
          <span className="w-2 h-2 rounded-full bg-rose-500 relative shadow-[0_0_8px_rgba(225,29,72,1)]" />
        </div>
      </div>

      <style>{`
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-spin-reverse {
          animation: spin-reverse 3.5s linear infinite;
        }
        .animate-spin-slow {
          animation: spin 9s linear infinite;
        }
      `}</style>
    </div>
  );
}
