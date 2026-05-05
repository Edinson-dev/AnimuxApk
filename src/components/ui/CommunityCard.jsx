import React from 'react';
import { Zap, MessageCircle, ExternalLink } from 'lucide-react';

export default function CommunityCard() {
  return (
    <div className="relative group overflow-hidden rounded-2xl border border-[#0088cc]/20 bg-[#0088cc]/5 backdrop-blur-xl animate-fade-in">
      <div className="relative p-4 md:p-5 flex items-center gap-4">
        {/* Icono pequeño y elegante */}
        <div className="w-10 h-10 md:w-12 md:h-12 bg-[#0088cc] rounded-xl flex items-center justify-center shadow-lg shadow-[#0088cc]/20 shrink-0 transform group-hover:scale-105 transition-transform">
          <Zap className="w-5 h-5 md:w-6 md:h-6 text-white fill-current" />
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-[13px] md:text-base font-black text-white uppercase tracking-tight truncate">
            ¿Buscas algo más?
          </h2>
          <p className="text-[10px] md:text-xs text-gray-500 font-medium truncate">
            Pide canales o pelis en nuestro Telegram oficial
          </p>
        </div>

        <button
          onClick={() => window.open('https://t.me/AnimuxOficial', '_blank')}
          className="px-4 py-2 bg-[#0088cc] hover:bg-[#0099e6] text-white rounded-lg font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all active:scale-95 whitespace-nowrap"
        >
          Unirse
        </button>
      </div>
    </div>
  );
}
