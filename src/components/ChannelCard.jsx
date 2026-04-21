import React from 'react';
import { Heart, Play } from 'lucide-react';

export default function ChannelCard({ channel, isFavorite, toggleFavorite, onPlay }) {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 rounded-2xl overflow-hidden group relative cursor-pointer flex flex-col hover:-translate-y-2 hover:shadow-[0_15px_30px_-5px_rgba(99,102,241,0.3)] hover:border-primary/50 transition-all duration-300"
         onClick={() => onPlay(channel)}>
      <div className="relative aspect-video overflow-hidden bg-black/40">
        <img 
          src={channel.logo} 
          alt={channel.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
          loading="lazy"
        />
        
        {/* Play Overlay with Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="bg-primary text-white rounded-full p-4 shadow-[0_0_20px_rgba(99,102,241,0.6)] transform scale-75 group-hover:scale-100 transition-transform duration-300 backdrop-blur-sm">
            <Play className="w-6 h-6 ml-1" fill="currentColor" />
          </div>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(channel.id);
          }}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 hover:scale-110 active:scale-95 transition-all z-10"
        >
          <Heart 
            className={`w-5 h-5 transition-colors ${isFavorite ? 'text-rose-500' : 'text-white'}`} 
            fill={isFavorite ? "currentColor" : "none"}
          />
        </button>
      </div>
      
      <div className="p-4 flex-1 flex flex-col justify-between">
        <h3 className="font-semibold text-lg text-gray-200 group-hover:text-white transition-colors line-clamp-1">{channel.name}</h3>
        <span className="text-xs text-primary mt-1 uppercase tracking-wider font-bold opacity-80">{channel.category}</span>
      </div>
    </div>
  );
}
