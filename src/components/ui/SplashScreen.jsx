import React, { useState, useEffect } from 'react';

export default function SplashScreen({ isLoading, appVersion = "1.5", onFinish }) {
  const [fadingOut, setFadingOut] = useState(false);
  const [statusTextIndex, setStatusTextIndex] = useState(0);

  const statusMessages = [
    'Iniciando sistema...',
    'Sincronizando canales y señales...',
    'Conexión segura establecida',
    'Bienvenido a Animux'
  ];

  // Ciclo sutil de micro-textos de estado
  useEffect(() => {
    const interval = setInterval(() => {
      setStatusTextIndex(prev => (prev < statusMessages.length - 1 ? prev + 1 : prev));
    }, 450);
    return () => clearInterval(interval);
  }, []);

  // Manejo de salida con desvanecimiento cinemático (Fade Out)
  useEffect(() => {
    if (!isLoading && !fadingOut) {
      setFadingOut(true);
      const timer = setTimeout(() => {
        onFinish?.();
      }, 650);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  return (
    <div 
      className={`fixed inset-0 z-[1000] bg-[#040407] flex flex-col items-center justify-center font-sans overflow-hidden select-none transition-all duration-700 ease-out ${
        fadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Luces atmosféricas OLED Cinema */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[18%] left-1/2 -translate-x-1/2 w-[550px] h-[350px] bg-rose-600/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-[400px] h-[250px] bg-violet-600/10 rounded-full blur-[120px]" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-9">
        {/* Logo Card Holográfico */}
        <div className="relative group">
          {/* Halo de luz viva respirable */}
          <div className="absolute -inset-4 bg-gradient-to-tr from-rose-600/35 via-rose-500/20 to-violet-600/25 rounded-[3rem] blur-2xl animate-pulse" />

          {/* Caja squircle tvOS Glassmorphism */}
          <div className="relative w-28 h-28 md:w-36 md:h-36 p-5 bg-white/[0.04] backdrop-blur-3xl rounded-[2.5rem] border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] flex items-center justify-center ring-1 ring-rose-500/20 transform animate-float">
            {/* Destello sutil interior */}
            <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

            <img
              src="/icon-192.png"
              alt="Animux Logo"
              className="w-full h-full object-contain filter drop-shadow-[0_4px_20px_rgba(225,29,72,0.65)] relative z-10"
            />
          </div>
        </div>

        {/* Identidad y Tipografía Cinematográfica */}
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <h1 className="text-5xl md:text-7xl font-black tracking-[-0.04em] uppercase bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent drop-shadow-[0_2px_20px_rgba(225,29,72,0.3)]">
              ANIMUX
            </h1>

            {/* Pill Badge Premium */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-lg shadow-black/40">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span className="text-[10px] md:text-xs text-rose-400 font-black uppercase tracking-[0.35em]">
                Live TV • Cinema • Deportes
              </span>
            </div>
          </div>

          {/* Barra Láser de Carga Tecnológica (Minimalista) */}
          <div className="pt-5 flex flex-col items-center gap-3">
            <div className="w-52 md:w-64 h-[3px] bg-white/[0.08] rounded-full overflow-hidden relative shadow-[0_0_15px_rgba(225,29,72,0.3)]">
              <div className="h-full bg-gradient-to-r from-transparent via-rose-500 to-white rounded-full animate-laser-flow" />
            </div>

            {/* Micro-texto dinámico */}
            <p className="text-[10px] md:text-[11px] font-bold text-zinc-400 uppercase tracking-[0.3em] h-4 transition-all duration-300">
              {statusMessages[statusTextIndex]}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Tecnológico */}
      <div className="absolute bottom-9 text-center flex items-center gap-2 opacity-40">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)]" />
        <p className="text-[9px] font-black text-white uppercase tracking-[0.3em]">
          V{appVersion} • Conexión Segura
        </p>
      </div>

      <style>{`
        @keyframes laser-flow {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(30%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-laser-flow {
          animation: laser-flow 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}
