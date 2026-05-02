import React, { useState } from 'react';
import { Play, Heart, Share2, X, Shield } from 'lucide-react';
import Player from '../core/Player';
import ChannelCard from './ChannelCard';
import { toast } from './Toast';

export default function DetailsModal({ channel, onClose, onPlay, isFavorite, toggleFavorite, allChannels = [], onSelect }) {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!channel) return null;

  const recommended = allChannels
    .filter(c => c.category === channel.category && c.id !== channel.id)
    .slice(0, 12);

  const displayName = channel.displayName || channel.name;
  const isVOD = channel.isVOD === true;

  const handleShare = async () => {
    const shareData = {
      title: displayName,
      text: channel.description || `Mira ${displayName} en Animux`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success('Contenido compartido');
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.info('Enlace copiado al portapapeles');
      }
    } catch (e) {
      if (e.name !== 'AbortError') toast.error('No se pudo compartir');
    }
  };

  const handleFavorite = () => {
    toggleFavorite(channel.id);
    toast.fav(isFavorite ? 'Eliminado de favoritos' : 'Añadido a favoritos');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-fade-in overflow-hidden">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-[120] w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Hero Area */}
      <div className="relative w-full aspect-video md:h-[60vh] bg-black shrink-0 overflow-hidden">
        {!isPlaying ? (
          <div className="relative w-full h-full group">
            <img
              src={channel.logo || channel.poster}
              alt={displayName}
              className={`w-full h-full opacity-60 scale-105 group-hover:scale-100 transition-all duration-1000 ${isVOD ? 'object-cover' : 'object-contain p-8'}`}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={() => setIsPlaying(true)}
                className="w-16 h-16 md:w-24 md:h-24 bg-white text-black rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95"
              >
                <Play className="w-8 h-8 md:w-12 md:h-12 fill-current ml-1" />
              </button>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black via-black/80 to-transparent" />
          </div>
        ) : (
          <div className="w-full h-full relative">
            <Player
              channel={channel}
              onClose={() => setIsPlaying(false)}
              playlist={allChannels.filter(c => c.category === channel.category)}
              isInline={true}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar bg-black">
        <div className="px-6 md:px-24 py-8 space-y-8 max-w-[1800px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

            {/* Left */}
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-[10px] font-black tracking-[0.3em] text-white/40 uppercase">
                  <span>{channel.category || 'Animux'}</span>
                  <span className="w-1 h-1 bg-white/20 rounded-full" />
                  <span>2024</span>
                  <span className="w-1 h-1 bg-white/20 rounded-full" />
                  <span>4K UHD</span>
                  <span className="w-1 h-1 bg-white/20 rounded-full hidden md:block" />
                  <span className="text-green-500 hidden md:flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Transmisión Segura
                  </span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-tight">
                  {displayName}
                </h1>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setIsPlaying(true)}
                  className="flex-1 md:flex-none md:px-10 py-3.5 bg-rose-600 text-white rounded-full font-black text-xs hover:bg-rose-500 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest shadow-xl shadow-rose-600/20"
                >
                  <Play className="w-4 h-4 fill-current" /> Reproducir Ahora
                </button>
                <button
                  onClick={handleFavorite}
                  className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all ${isFavorite ? 'bg-rose-600 text-white border-rose-600' : 'bg-white/5 border-white/20 text-white hover:bg-white/10'}`}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={handleShare}
                  title="Compartir"
                  className="w-12 h-12 rounded-full border border-white/20 text-white hover:bg-white/10 flex items-center justify-center transition-all"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => toast.info('Informe enviado. Revisaremos este canal pronto.')}
                  title="Reportar problema"
                  className="w-12 h-12 rounded-full border border-white/20 text-rose-500/60 hover:text-rose-500 hover:bg-rose-500/10 flex items-center justify-center transition-all"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
                </button>
              </div>

              <div className="space-y-6">
                {!isVOD && (
                  <div className="p-5 bg-white/[0.03] border border-white/5 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2">
                       <span className="relative flex h-2 w-2">
                         <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                         <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                       </span>
                       <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest">En emisión ahora</h4>
                    </div>
                    <div className="space-y-1">
                       <p className="text-white font-black text-lg uppercase tracking-tight">Programación en vivo 24/7</p>
                       <p className="text-gray-500 text-xs font-medium italic">Streaming premium de alta calidad sin interrupciones publicitarias.</p>
                    </div>
                  </div>
                )}
                
                <p className="text-gray-400 text-sm md:text-base leading-relaxed max-w-3xl font-medium">
                  {channel.description || 'Una obra maestra del entretenimiento digital. Disfruta de esta selección curada exclusivamente para Animux.'}
                </p>
              </div>
            </div>

            {/* Right */}
            <div className="space-y-6 lg:border-l lg:border-white/5 lg:pl-12">
              <div className="space-y-2">
                <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Género</h4>
                <p className="text-gray-500 text-sm font-bold uppercase">{channel.category || 'Varios'}</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Estado de Señal</h4>
                <div className="flex items-center gap-1">
                   <div className="w-1.5 h-3 bg-green-500 rounded-full" />
                   <div className="w-1.5 h-4 bg-green-500 rounded-full" />
                   <div className="w-1.5 h-5 bg-green-500 rounded-full" />
                   <span className="text-green-500 text-[10px] font-black ml-2 uppercase">Excelente</span>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">ID Interno</h4>
                <p className="text-gray-700 text-[10px] font-mono break-all">{channel.id}</p>
              </div>
            </div>
          </div>

          {/* Related */}
          {recommended.length > 0 && (
            <div className="space-y-6 pt-10 border-t border-white/5">
              <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">Más como esto</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {recommended.map(item => (
                  <ChannelCard
                    key={item.id}
                    channel={item}
                    onPlay={() => { onSelect(item); setIsPlaying(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
