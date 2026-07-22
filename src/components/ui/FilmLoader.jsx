import React from 'react';

export default function FilmLoader({ className = "w-16 h-16" }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Sombra ambient glow neumórfica */}
      <div className="absolute inset-0 bg-rose-600/30 rounded-full blur-xl animate-pulse" />
      
      {/* Carretes de Película (Film Reel) */}
      <div className="relative z-10 w-full h-full flex items-center justify-center animate-spin-slow">
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full drop-shadow-[0_10px_20px_rgba(225,29,72,0.5)]"
        >
          {/* Anillo exterior del carrete */}
          <circle cx="50" cy="50" r="44" fill="#0d0d11" stroke="url(#roseGradient)" strokeWidth="6" />
          
          {/* Perforaciones de la cinta de película en el borde */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const x = 50 + 40 * Math.cos(rad);
            const y = 50 + 40 * Math.sin(rad);
            return (
              <rect
                key={i}
                x={x - 2}
                y={y - 2.5}
                width="4"
                height="5"
                rx="1"
                fill="#e11d48"
                transform={`rotate(${angle + 90}, ${x}, ${y})`}
              />
            );
          })}

          {/* Círculo intermedio punteado */}
          <circle cx="50" cy="50" r="32" fill="#14141c" stroke="#e11d48" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.7" />

          {/* Orificios circulares del carrete de cine (5 orificios) */}
          {[0, 72, 144, 216, 288].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const x = 50 + 20 * Math.cos(rad);
            const y = 50 + 20 * Math.sin(rad);
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="8.5"
                fill="#050508"
                stroke="#e11d48"
                strokeWidth="1"
              />
            );
          })}

          {/* Eje central */}
          <circle cx="50" cy="50" r="9" fill="url(#coreGradient)" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="3" fill="#ffffff" />

          {/* Gradientes */}
          <defs>
            <linearGradient id="roseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="50%" stopColor="#e11d48" />
              <stop offset="100%" stopColor="#9f1239" />
            </linearGradient>
            <linearGradient id="coreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e11d48" />
              <stop offset="100%" stopColor="#881337" />
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
