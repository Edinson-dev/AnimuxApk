import React from 'react';
import { Film } from 'lucide-react';

export default function FilmLoader({ className = "w-16 h-16" }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Halo de luz suave */}
      <div className="absolute inset-0 bg-rose-600/20 rounded-full blur-xl animate-pulse" />

      {/* Anillo de giro suave */}
      <div 
        className="w-full h-full rounded-full border-2 border-white/10 border-t-rose-500 border-r-rose-500/30 animate-spin" 
        style={{ animationDuration: '0.9s' }} 
      />

      {/* Ícono cinematográfico sutil */}
      <div className="absolute inset-2.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center">
        <Film className="w-5 h-5 text-rose-500/80" />
      </div>
    </div>
  );
}
