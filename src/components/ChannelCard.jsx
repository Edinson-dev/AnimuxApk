import React from 'react';
import { Heart, Play } from 'lucide-react';

export default function ChannelCard({ channel, isFavorite, toggleFavorite, onPlay }) {
  return (
    <div className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:z-10 bg-[#0c0c14] border border-white/5 hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(79,70,229,0.3)] shadow-lg aspect-video flex flex-col justify-end"
         onClick={() => onPlay(channel)}>
      
      {/* Thumbnail/Logo Area */}
      <div className="absolute inset-0 p-8 flex items-center justify-center bg-black/40 opacity-80 group-hover:opacity-100 transition-opacity">
        <img 
          src={channel.logo} 
          alt={channel.name} 
          className="max-w-full max-h-full object-contain filter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] group-hover:drop-shadow-[0_0_25px_rgba(255,255,255,0.5)] transition-all duration-500"
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=300&h=300'; }}
          loading="lazy"
        />
      </div>

      {/* Dark overlay for text readability at bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300"></div>

      {/* Hover Play Button (Center) */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
        <div className="bg-indigo-600/90 text-white rounded-full p-4 transform scale-50 group-hover:scale-100 transition-transform duration-300 backdrop-blur-sm shadow-[0_0_20px_rgba(79,70,229,0.8)]">
          <Play className="w-8 h-8 fill-current translate-x-0.5" />
        </div>
      </div>

      {/* Info Area */}
      <div className="relative p-4 z-10 w-full bg-black/40 backdrop-blur-md border-t border-white/10 group-hover:bg-indigo-900/40 transition-colors">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 overflow-hidden">
            <h3 className="font-bold text-white text-base truncate group-hover:text-indigo-300 transition-colors">{channel.name}</h3>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mt-0.5">{channel.category}</p>
          </div>
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(channel.id);
            }}
            className="p-2 rounded-full bg-black/50 hover:bg-white/20 transition-colors z-30 border border-white/5"
          >
            <Heart 
              className={`w-5 h-5 transition-colors ${isFavorite ? 'text-pink-500 fill-pink-500 drop-shadow-[0_0_10px_rgba(236,72,153,0.8)]' : 'text-white'}`} 
            />
          </button>
        </div>
      </div>
    </div>
  );
}
