import React, { useState, useEffect } from 'react';
import { Play, Heart, Share2, HelpCircle, Laptop, ChevronRight, Star, X } from 'lucide-react';
import Player from './Player';
import ChannelCard from './ChannelCard';

export default function DetailsModal({ channel, onClose, onPlay, isFavorite, toggleFavorite, onReportBroken, allChannels = [], onSelect }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('Resumen');

  if (!channel) return null;

  const recommended = allChannels
    .filter(c => c.category === channel.category && c.id !== channel.id)
    .slice(0, 12);

  const displayName = channel.displayName || channel.name;

  return (
    <div className="fixed inset-0 z-[100] bg-[#060608] flex flex-col animate-fade-in overflow-hidden">
      {/* Top Navigation Bar (Mobile) */}
      <div className="absolute top-0 left-0 right-0 z-[110] p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/10 text-white active:scale-95 transition-all">
          <ChevronRight className="w-6 h-6 rotate-180" />
        </button>
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/10 text-white"><Share2 className="w-5 h-5" /></button>
          <button 
            onClick={() => toggleFavorite(channel.id)}
            className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center border transition-all ${isFavorite ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-black/20 border-white/10 text-white'}`}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Hero Section / Video Player */}
      <div className="relative w-full aspect-video md:aspect-[21/9] bg-black shrink-0">
        {!isPlaying ? (
          <div className="relative w-full h-full group">
            <img 
              src={channel.logo} 
              alt={displayName}
              className="w-full h-full object-cover opacity-50 transition-all duration-1000 scale-105 group-hover:scale-100"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <button 
                onClick={() => setIsPlaying(true)}
                className="w-16 h-16 md:w-24 md:h-24 bg-white text-black rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.2)] transition-all hover:scale-110 active:scale-95"
              >
                <Play className="w-8 h-8 md:w-12 md:h-12 fill-current ml-1" />
              </button>
            </div>
            {/* Ambient Shadow */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#060608] to-transparent"></div>
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

      {/* Content Section */}
      <div className="flex-1 overflow-y-auto no-scrollbar bg-[#060608]">
        <div className="px-6 md:px-16 py-8 space-y-8 max-w-7xl mx-auto">
          {/* Header Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[10px] font-black rounded uppercase">98% para ti</span>
              <span className="text-gray-500 text-[10px] font-bold">2024</span>
              <span className="px-1.5 py-0.5 border border-gray-700 text-gray-400 text-[9px] font-bold rounded">HD</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-[0.9]">
              {displayName}
            </h1>

            <div className="flex flex-wrap gap-2">
               {['Acción', 'Drama', 'Streaming'].map(tag => (
                 <span key={tag} className="text-[9px] text-gray-500 font-bold uppercase tracking-widest px-2 py-1 bg-white/5 rounded-full">{tag}</span>
               ))}
            </div>
          </div>

          {/* Action Buttons (Desktop style inline) */}
          <div className="flex gap-4">
             <button 
               onClick={() => setIsPlaying(true)}
               className="flex-1 md:flex-none md:px-12 py-4 bg-white text-black rounded-xl font-black text-xs md:text-sm hover:bg-indigo-500 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-3"
             >
               <Play className="w-4 h-4 fill-current" /> REPRODUCIR
             </button>
             <button className="p-4 bg-white/5 rounded-xl border border-white/10 text-white hover:bg-white/10 transition-all">
                <Share2 className="w-5 h-5" />
             </button>
          </div>

          {/* Tabs Navigation */}
          <div className="flex gap-8 border-b border-white/5">
            {['Resumen', 'Similares', 'Detalles'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {tab}
                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 rounded-full animate-scale-x" />}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="animate-fade-in pb-20">
            {activeTab === 'Resumen' && (
              <div className="space-y-6">
                <p className="text-gray-400 text-sm md:text-lg leading-relaxed max-w-4xl">
                  {channel.description || 'Disfruta de la mejor programación en vivo y bajo demanda. Esta producción ofrece una experiencia inmersiva con alta definición y sonido envolvente. Explora los límites de la narrativa moderna con Animux.'}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm">
                   <p className="text-gray-500"><span className="text-gray-400 font-bold">Protagonistas:</span> Animux Community, Edinson Dev</p>
                   <p className="text-gray-500"><span className="text-gray-400 font-bold">Director:</span> IA Visionary</p>
                </div>
              </div>
            )}

            {activeTab === 'Similares' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
            )}

            {activeTab === 'Detalles' && (
              <div className="space-y-4 text-sm text-gray-400">
                 <p><span className="text-white font-bold">Géneros:</span> Entretenimiento, Variedades, Internacional</p>
                 <p><span className="text-white font-bold">Este título es:</span> Emocionante, Visualmente impactante</p>
                 <p><span className="text-white font-bold">Clasificación:</span> +13</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
