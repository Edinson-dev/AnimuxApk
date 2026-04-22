import React, { useState, useEffect } from 'react';
import { Play, Heart, Share2, ChevronRight, X, Info } from 'lucide-react';
import Player from './Player';
import ChannelCard from './ChannelCard';

export default function DetailsModal({ channel, onClose, onPlay, isFavorite, toggleFavorite, allChannels = [], onSelect }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('Resumen');

  if (!channel) return null;

  const recommended = allChannels
    .filter(c => c.category === channel.category && c.id !== channel.id)
    .slice(0, 12);

  const displayName = channel.displayName || channel.name;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-fade-in overflow-hidden">
      {/* HBO Style Close Button */}
      <button 
        onClick={onClose} 
        className="absolute top-6 right-6 z-[120] w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Main Video/Hero Area */}
      <div className="relative w-full aspect-video md:h-[70vh] bg-black shrink-0 overflow-hidden">
        {!isPlaying ? (
          <div className="relative w-full h-full group">
            <img 
              src={channel.logo} 
              alt={displayName}
              className="w-full h-full object-cover opacity-60 scale-105 group-hover:scale-100 transition-all duration-1000"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <button 
                onClick={() => setIsPlaying(true)}
                className="w-20 h-20 md:w-32 md:h-32 bg-white text-black rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95"
              >
                <Play className="w-10 h-10 md:w-14 md:h-14 fill-current ml-2" />
              </button>
            </div>
            {/* HBO Style Bottom Fade */}
            <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
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

      {/* Content Area - HBO Style (Vast Spacing, Bold Typography) */}
      <div className="flex-1 overflow-y-auto no-scrollbar bg-black">
        <div className="px-6 md:px-24 py-12 space-y-12 max-w-[1800px] mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left Info */}
            <div className="lg:col-span-2 space-y-8">
               <div className="space-y-4">
                  <div className="flex items-center gap-4 text-[10px] font-black tracking-[0.3em] text-white/40 uppercase">
                    <span>{channel.category || 'Animux'}</span>
                    <span className="w-1 h-1 bg-white/20 rounded-full" />
                    <span>2024</span>
                    <span className="w-1 h-1 bg-white/20 rounded-full" />
                    <span>4K UHD</span>
                  </div>
                  <h1 className="text-5xl md:text-8xl font-black text-white uppercase italic tracking-tighter leading-[0.85]">
                    {displayName}
                  </h1>
               </div>

               <div className="flex flex-wrap gap-4 pt-4">
                  <button 
                    onClick={() => setIsPlaying(true)}
                    className="flex-1 md:flex-none md:px-16 py-5 bg-white text-black rounded-full font-black text-sm hover:bg-gray-200 transition-all active:scale-95 flex items-center justify-center gap-4 uppercase tracking-widest"
                  >
                    <Play className="w-5 h-5 fill-current" /> Reproducir
                  </button>
                  <button 
                    onClick={() => toggleFavorite(channel.id)}
                    className={`w-14 h-14 rounded-full border flex items-center justify-center transition-all ${isFavorite ? 'bg-white text-black border-white' : 'bg-white/5 border-white/20 text-white hover:bg-white/10'}`}
                  >
                    <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
                  <button className="w-14 h-14 rounded-full border border-white/20 text-white hover:bg-white/10 flex items-center justify-center transition-all">
                    <Share2 className="w-6 h-6" />
                  </button>
               </div>

               <p className="text-gray-400 text-lg md:text-xl leading-relaxed max-w-4xl font-medium">
                  {channel.description || 'Una obra maestra del entretenimiento digital. Disfruta de esta selección curada exclusivamente para Animux, con una calidad de imagen sorprendente y una narrativa que te atrapará desde el primer segundo.'}
               </p>
            </div>

            {/* Right Side Info */}
            <div className="space-y-8 lg:border-l lg:border-white/5 lg:pl-12">
               <div className="space-y-4">
                  <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Reparto</h4>
                  <p className="text-gray-500 text-sm">Animux Community, Edinson Dev, IA Visionary</p>
               </div>
               <div className="space-y-4">
                  <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Director</h4>
                  <p className="text-gray-500 text-sm">IA Creative Director</p>
               </div>
               <div className="space-y-4">
                  <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Géneros</h4>
                  <p className="text-gray-500 text-sm">{channel.category}, Acción, Drama</p>
               </div>
            </div>
          </div>

          {/* HBO Style "Related" Grid */}
          <div className="space-y-8 pt-12 border-t border-white/5">
            <h3 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter italic">Más como esto</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
               {recommended.map(item => (
                 <ChannelCard 
                   key={item.id} 
                   channel={item} 
                   onPlay={() => {
                      onSelect(item);
                      setIsPlaying(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                   }} 
                 />
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
