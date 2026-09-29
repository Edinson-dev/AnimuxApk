import React, { useState, useEffect } from 'react';

export default function SplashScreen({ isLoading, appVersion = "1.5", onFinish }) {
  const [fadingOut, setFadingOut] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  // Muestra de pósters cinemáticos de alta definición para el fondo ambiental
  const backdropPosters = [
    "https://image.tmdb.org/t/p/w500/1E5baAaEse26fej7uHcjOgEE2t2.jpg", // Fast X
    "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", // Oppenheimer
    "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg", // The Dark Knight
    "https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctfOSN2Ydg395Jv3.jpg", // Guardians of the Galaxy
    "https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg", // Dune 2
    "https://image.tmdb.org/t/p/w500/fiVW06jE7z9YnO4trhaMEdclSiC.jpg", // Fast & Furious
    "https://image.tmdb.org/t/p/w500/A4j8S6moJS2zNtRR8oWF08gRwL.jpg", // Spider-Man
    "https://image.tmdb.org/t/p/w500/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg", // Kung Fu Panda 4
    "https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg", // Avengers
    "https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg", // Inside Out 2
    "https://image.tmdb.org/t/p/w500/gPbM0MK8CP8A174rmUwxtjYeR89.jpg", // Deadpool & Wolverine
    "https://image.tmdb.org/t/p/w500/bXi6IQiCuHD00X97JvP2M1hq69X.jpg"  // Furiosa
  ];

  // Tiempo de exhibición natural para inicializar recursos (~2.2s)
  useEffect(() => {
    const minTimer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 2200);
    return () => clearTimeout(minTimer);
  }, []);

  // Transición suave de disolución al terminar
  useEffect(() => {
    if (!isLoading && minTimeElapsed && !fadingOut) {
      setFadingOut(true);
      const exitTimer = setTimeout(() => {
        onFinish?.();
      }, 550);
      return () => clearTimeout(exitTimer);
    }
  }, [isLoading, minTimeElapsed, fadingOut, onFinish]);

  // Safety timer máximo (3.5s)
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setFadingOut(true);
      setTimeout(() => {
        onFinish?.();
      }, 550);
    }, 3500);
    return () => clearTimeout(safetyTimer);
  }, [onFinish]);

  return (
    <div 
      className={`fixed inset-0 z-[1000] bg-[#050508] flex flex-col items-center justify-between p-6 sm:p-10 font-sans select-none transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        fadingOut ? 'opacity-0 scale-[1.03] blur-[2px] pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* ── Fondo Cinematográfico Atmosférico (Estilo Netflix / Disney+) ── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        
        {/* Mosaico de pósters de cine con inclinación de cámara */}
        <div className="absolute -inset-10 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3.5 opacity-25 transform -rotate-3 scale-110">
          {backdropPosters.concat(backdropPosters).map((src, i) => (
            <div key={i} className="aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-900 shadow-2xl">
              <img
                src={src}
                alt=""
                className="w-full h-full object-cover filter saturate-125"
                loading="eager"
              />
            </div>
          ))}
        </div>

        {/* Degradado de viñeta oscura para enfocar el centro */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/85 to-[#050508]/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050508] via-transparent to-[#050508]" />
        
        {/* Resplandor ambiental carmesí centrado */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-rose-600/15 rounded-full blur-[120px]" />
      </div>

      {/* Espaciador superior limpio */}
      <div className="w-full flex justify-end relative z-10">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.25em]">
          V{appVersion}
        </span>
      </div>

      {/* ── Bloque Central de Identidad OTT ── */}
      <div className="relative z-10 flex flex-col items-center gap-7 max-w-sm w-full text-center">
        
        {/* Isotipo con Reflejo de Cristal y Resplandor Vivo */}
        <div className="relative">
          {/* Halo sutil de luz detrás del icono */}
          <div className="absolute -inset-5 bg-gradient-to-tr from-rose-600/35 via-red-500/20 to-purple-600/20 rounded-[3rem] blur-2xl opacity-80 animate-pulse" />

          <div className="relative w-24 h-24 sm:w-28 sm:h-28 p-4 bg-gradient-to-b from-white/[0.12] to-white/[0.03] backdrop-blur-2xl border border-white/20 rounded-[2.2rem] sm:rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,255,255,0.4)] flex items-center justify-center">
            {/* Destello de cristal superior */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-[2.2rem] sm:rounded-t-[2.5rem] pointer-events-none" />

            <img
              src="/icon-192.png"
              alt="Animux"
              className="w-full h-full object-contain filter drop-shadow-[0_6px_20px_rgba(225,29,72,0.65)] relative z-10"
            />
          </div>
        </div>

        {/* Tipografía de Marca */}
        <div className="space-y-1.5 flex flex-col items-center">
          <h1 className="text-4xl sm:text-5xl font-black tracking-[-0.03em] uppercase bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent font-display drop-shadow-[0_2px_25px_rgba(225,29,72,0.3)]">
            ANIMUX
          </h1>
          <p className="text-[10px] sm:text-xs text-rose-400/90 font-bold uppercase tracking-[0.35em]">
            Cinema • Series • Live TV
          </p>
        </div>

        {/* ── Loader Circular Cinemático Premium (Estilo Apple TV / HBO Max) ── */}
        <div className="pt-3 flex items-center justify-center">
          <div className="relative w-7 h-7 flex items-center justify-center">
            {/* Anillo de fondo translúcido */}
            <div className="w-full h-full rounded-full border-2 border-white/10" />
            
            {/* Anillo giratorio con resplandor neón escarlata */}
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-rose-500 border-r-rose-400 animate-spin" />
            
            {/* Punto de luz central */}
            <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          </div>
        </div>

      </div>

      {/* Footer Minimalista de Calidad */}
      <div className="relative z-10 flex items-center gap-2">
        <p className="text-[9px] sm:text-[10px] font-semibold text-zinc-400/80 uppercase tracking-[0.3em]">
          Ultra High Definition • 4K OTT
        </p>
      </div>

    </div>
  );
}
