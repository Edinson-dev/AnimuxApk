import React from 'react';
import { X, Play, Star, Calendar, Clock, Info, Heart } from 'lucide-react';

export default function DetailsModal({ channel, onClose, onPlay, isFavorite, toggleFavorite }) {
  if (!channel) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-4xl bg-[#0a0a0c] md:rounded-3xl overflow-y-auto md:overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5 animate-slide-up flex flex-col md:flex-row h-[90vh] md:h-auto custom-scrollbar">
        
        {/* Poster / Image Section */}
        <div className="w-full md:w-2/5 aspect-[2/3] md:aspect-auto relative group">
          <img 
            src={channel.logo} 
            alt={channel.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-[#0a0a0c]"></div>
          
          <button 
            onClick={onClose}
            className="absolute top-4 left-4 p-2 rounded-full bg-black/40 text-white md:hidden"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Info Section */}
        <div className="flex-1 p-6 md:p-10 flex flex-col justify-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
               <span className="px-2 py-1 rounded-md bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-500/30">
                 {channel.isVOD ? 'Película Full HD' : 'Transmisión En Vivo'}
               </span>
               <div className="flex items-center gap-1 text-amber-400">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm font-bold">7.8</span>
               </div>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none">
              {channel.name}
            </h2>
            <div className="flex flex-wrap gap-2 pt-2">
              {channel.groupId && (
                <span className="px-3 py-1 bg-indigo-600/30 text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-500/30">
                  Colección Completa
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-gray-400 text-sm font-medium">
               <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> 2024</span>
               <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> 1h 45min</span>
               <span className="px-2 py-0.5 rounded border border-white/10 text-[10px]">16+</span>
            </div>
          </div>

          <p className="text-gray-300 text-base md:text-lg leading-relaxed line-clamp-4 md:line-clamp-none">
            {channel.description || 'Una emocionante producción llena de acción y drama. Disfruta de la mejor calidad de imagen y sonido en Animux Stream. Esta obra representa lo mejor del catálogo actual disponible para nuestros usuarios.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
             <button 
               onClick={() => onPlay(channel)}
               className="flex-1 bg-white text-black hover:bg-indigo-500 hover:text-white transition-all py-4 px-8 rounded-2xl font-black flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(255,255,255,0.1)] active:scale-95"
             >
               <Play className="w-6 h-6 fill-current" />
               REPRODUCIR AHORA
             </button>
             
             <button 
               onClick={() => toggleFavorite(channel.id)}
               className={`p-4 rounded-2xl border transition-all flex items-center justify-center gap-2 ${isFavorite ? 'bg-rose-500/10 border-rose-500 text-rose-500' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
             >
               <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
               <span className="md:hidden font-bold">Favoritos</span>
             </button>

             <button className="hidden md:flex p-4 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all items-center justify-center">
               <Info className="w-6 h-6" />
             </button>
          </div>
        </div>

        {/* Close Button Desktop */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all hidden md:block"
        >
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
