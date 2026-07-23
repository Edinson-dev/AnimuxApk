import React from 'react';

export default function TvLoader({ className = "w-16 h-16" }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Glow de fondo animado */}
      <div className="absolute inset-0 bg-rose-600/30 rounded-full blur-xl animate-pulse" />

      {/* Ícono de TV con ondas de señal animadas */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full drop-shadow-[0_10px_20px_rgba(225,29,72,0.5)]"
        >
          {/* Antenas de la TV */}
          <path 
            d="M 35 28 L 50 42 L 65 28" 
            fill="none" 
            stroke="url(#tvGlowGradient)" 
            strokeWidth="3.5" 
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Ondas de señal en las antenas */}
          <path
            d="M 28 20 A 12 12 0 0 1 40 18"
            fill="none"
            stroke="#f43f5e"
            strokeWidth="2"
            strokeLinecap="round"
            className="animate-pulse"
            opacity="0.8"
          />
          <path
            d="M 72 20 A 12 12 0 0 0 60 18"
            fill="none"
            stroke="#f43f5e"
            strokeWidth="2"
            strokeLinecap="round"
            className="animate-pulse"
            opacity="0.8"
          />

          {/* Cuerpo principal / Marco de la TV */}
          <rect 
            x="15" 
            y="40" 
            width="70" 
            height="48" 
            rx="10" 
            fill="#0d0d11" 
            stroke="url(#tvGlowGradient)" 
            strokeWidth="4"
          />

          {/* Pantalla de TV con brillo neumórfico */}
          <rect 
            x="21" 
            y="46" 
            width="50" 
            height="36" 
            rx="6" 
            fill="#161622"
          />

          {/* Línea de escaneo / Señal viva */}
          <path
            d="M 25 64 Q 35 56 46 64 T 67 64"
            fill="none"
            stroke="url(#tvSignalGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            className="animate-pulse"
          />

          {/* Botones / Controles laterales de la TV */}
          <circle cx="78" cy="52" r="3.5" fill="#f43f5e" />
          <circle cx="78" cy="62" r="3" fill="#881337" />
          <rect x="76" y="70" width="4" height="10" rx="2" fill="#e11d48" opacity="0.8" />

          {/* Defs de Gradientes */}
          <defs>
            <linearGradient id="tvGlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="50%" stopColor="#e11d48" />
              <stop offset="100%" stopColor="#881337" />
            </linearGradient>
            <linearGradient id="tvSignalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.2" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <style>{`
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
