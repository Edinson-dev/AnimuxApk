import React from 'react';
import { X, Play, Star, Calendar, Clock, Info, Heart, AlertCircle } from 'lucide-react';

export default function DetailsModal({ channel, onClose, onPlay, isFavorite, toggleFavorite, onReportBroken }) {
  if (!channel) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-[#0a0a0c] md:rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 animate-slide-up flex flex-col h-auto">
        
        {/* Poster / Header Section */}
        <div className="w-full aspect-video relative">
          <img 
            src={channel.logo} 
            alt={channel.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] to-transparent"></div>
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white backdrop-blur-md border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Section */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-4xl font-black text-white tracking-tighter">
              {channel.name}
            </h2>
            <div className="flex items-center gap-3 text-xs text-gray-400 font-bold uppercase tracking-widest">
               <span className="text-indigo-400">{channel.category}</span>
               <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
               <span>2024</span>
            </div>
          </div>

          <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">
            {channel.description || 'Disfruta de la mejor calidad de streaming. Contenido optimizado para una experiencia fluida y sin interrupciones.'}
          </p>

          <div className="flex gap-3">
             <button 
               onClick={() => onPlay(channel)}
               className="flex-1 bg-white text-black hover:bg-indigo-600 hover:text-white transition-all py-3 px-6 rounded-xl font-black text-xs flex items-center justify-center gap-2 active:scale-95"
             >
               <Play className="w-4 h-4 fill-current" />
               REPRODUCIR
             </button>
             
             <button 
               onClick={() => toggleFavorite(channel.id)}
               className={`p-3 rounded-xl border transition-all ${isFavorite ? 'bg-rose-500/10 border-rose-500 text-rose-500' : 'bg-white/5 border-white/10 text-white'}`}
             >
               <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
             </button>

             <button 
               onClick={() => {
                 if(window.confirm('¿Reportar error?')) {
                   onReportBroken(channel.id);
                   onClose();
                 }
               }}
          <X className="w-6 h-6" />
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @media (min-width: 768px) {
          @keyframes slideUp {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        }
        .animate-slide-up {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </div>
  );
}
