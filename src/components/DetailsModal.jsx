import React, { useState } from 'react';
import { Play, Heart, Share2, HelpCircle, Laptop, ChevronRight } from 'lucide-react';
import Player from './Player';
import ChannelCard from './ChannelCard';

export default function DetailsModal({ channel, onClose, onPlay, isFavorite, toggleFavorite, onReportBroken, allChannels = [], onSelect }) {
  const [isPlaying, setIsPlaying] = useState(false);
  if (!channel) return null;

  const recommended = allChannels
    .filter(c => c.category === channel.category && c.id !== channel.id)
    .slice(0, 6);

  return (
    <div className="fixed inset-0 z-[100] bg-[#060608] flex flex-col animate-fade-in overflow-y-auto no-scrollbar">
      {/* Player Section (Top) */}
      <div className="relative w-full aspect-video bg-black shrink-0">
        {!isPlaying ? (
          <div className="relative w-full h-full group">
            <img 
              src={channel.logo} 
              alt={channel.name}
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <button 
                onClick={() => setIsPlaying(true)}
                className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95"
              >
                <Play className="w-10 h-10 fill-current ml-1" />
              </button>
            </div>
            
            {/* Player Top Controls */}
            <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10">
                <ChevronRight className="w-6 h-6 text-white rotate-180" />
              </button>
              <div className="flex items-center gap-4">
                <button className="p-2 rounded-full hover:bg-white/10"><HelpCircle className="w-6 h-6 text-white" /></button>
                <button className="p-2 rounded-full hover:bg-white/10"><Laptop className="w-6 h-6 text-white" /></button>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full relative">
            <Player 
              channel={channel} 
              onClose={() => setIsPlaying(false)} 
              playlist={allChannels.filter(c => c.category === channel.category)}
              onPlayNext={(next) => {/* handle next */}}
              onReportBroken={onReportBroken}
              isInline={true}
            />
            <button 
              onClick={() => setIsPlaying(false)}
              className="absolute top-4 left-4 z-[120] p-2 rounded-full bg-black/40 text-white"
            >
              <ChevronRight className="w-6 h-6 rotate-180" />
            </button>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="px-6 py-6 space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              {channel.name} <span className="text-indigo-500 text-lg italic">6.3</span>
            </h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
              United States | 2024 | {channel.category || 'General'}
            </p>
          </div>
          <div className="flex gap-3">
            <button className="p-3 rounded-full bg-white/5 border border-white/10 text-white"><Share2 className="w-5 h-5" /></button>
            <button 
              onClick={() => toggleFavorite(channel.id)}
              className={`p-3 rounded-full border transition-all ${isFavorite ? 'bg-indigo-500/20 border-indigo-500 text-indigo-500' : 'bg-white/5 border-white/10 text-white'}`}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-gray-400 text-sm leading-relaxed">
            {channel.description || 'La historia se desarrolla en el transcurso de una sola mañana y está protagonizada por una producción de alta calidad. El espectador se sumerge en una trama llena de suspense y emoción...'}
            <span className="text-indigo-500 ml-1 cursor-pointer">vea más</span>
          </p>

          <div className="space-y-1 text-xs">
            <p className="text-gray-500"><span className="text-gray-400 font-bold">Director:</span> Antoine Fuqua</p>
            <p className="text-gray-500"><span className="text-gray-400 font-bold">Actores:</span> Animux Studios, Edinson Dev</p>
          </div>
        </div>

        {/* Ad Banner Placeholder */}
        <div className="w-full h-24 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden relative">
            <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-yellow-500 rounded text-[8px] font-black text-black uppercase">Anuncio</div>
            <div className="text-center">
              <p className="text-indigo-400 font-black text-xs uppercase tracking-widest">Sube de Nivel</p>
              <p className="text-white text-[10px] font-bold">Consigue Animux Premium para evitar anuncios</p>
            </div>
        </div>

        {/* Recommendations */}
        <div className="space-y-4 pt-4">
          <h3 className="text-sm font-black text-white uppercase tracking-widest">También podría gustarte</h3>
          <div className="grid grid-cols-3 gap-3">
             {recommended.map(item => (
               <ChannelCard key={item.id} channel={item} onPlay={() => {
                 if (onSelect) onSelect(item);
                 setIsPlaying(false);
               }} />
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}
