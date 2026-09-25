import React from 'react';

export default function FilmLoader({ className = "w-20 h-20" }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Halo de luz cinematográfico profundo */}
      <div className="absolute inset-0 bg-gradient-to-tr from-rose-600/30 via-purple-600/20 to-rose-500/30 rounded-full blur-2xl animate-pulse" />

      {/* Anillo orbital exterior tipo HBO / Disney+ */}
      <div className="absolute inset-0 rounded-full p-[2px] animate-spin" style={{ animationDuration: '2.5s' }}>
        <div className="w-full h-full rounded-full bg-gradient-to-r from-rose-500 via-transparent to-rose-600" />
      </div>

      {/* Segundo aro inverso de alta velocidad */}
      <div className="absolute inset-2 rounded-full p-[1.5px] animate-spin" style={{ animationDuration: '1.4s', animationDirection: 'reverse' }}>
        <div className="w-full h-full rounded-full bg-gradient-to-t from-rose-400/80 via-transparent to-transparent" />
      </div>

      {/* Núcleo central con glow */}
      <div className="relative z-10 w-10 h-10 rounded-full bg-[#0a0a0f] border border-rose-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(225,29,72,0.4)]">
        <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping opacity-75" />
        <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_#ffffff]" />
      </div>
    </div>
  );
}
