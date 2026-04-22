import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import ChannelCard from './components/ChannelCard';
import Player from './components/Player';
import Hero from './components/Hero';
import DetailsModal from './components/DetailsModal';
import { Tv2, Heart, Compass, Grid, Play, Home, Search, Star, MessageSquare, PlayCircle } from 'lucide-react';

function App() {
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [recentlyWatched, setRecentlyWatched] = useState(null);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [channelData, setChannelData] = useState({ channels: [] });
  const [visibleCount, setVisibleCount] = useState(30);
  
  useEffect(() => {
    setVisibleCount(30);
  }, [activeCategory, searchQuery]);
  
  const featuredHeroChannel = useMemo(() => {
    if (!channelData.channels.length) return null;
    const channel = channelData.channels.find(c => c.category === 'Cine' || c.category === 'Series') || channelData.channels[0];
    if (channel?.groupId) {
       return { ...channel, displayName: channel.name.split(' - ')[0].trim() };
    }
    return channel;
  }, [channelData]);

  useEffect(() => {
    setIsAppLoading(true);
    fetch('/channels.json')
      .then(res => res.json())
      .then(data => {
        if (data && data.channels) {
          setChannelData(data);
          const savedRecent = localStorage.getItem('viciontv_recent');
          if (savedRecent) {
             // ID comparison safe for both String and Number
             const channel = data.channels.find(c => String(c.id) === String(savedRecent));
             if (channel) setRecentlyWatched(channel);
          }
        }
      })
      .catch(err => {
        console.error("Error fatal cargando canales:", err);
      })
      .finally(() => setIsAppLoading(false));

    const savedFavorites = localStorage.getItem('viciontv_favorites');
    if (savedFavorites) {
      try { setFavorites(JSON.parse(savedFavorites)); } catch(e) { setFavorites([]); }
    }
  }, []);

  const handlePlayChannel = (channel) => {
    if (!channel) return;
    setActiveChannel(channel);
    setSelectedDetail(null);
    setRecentlyWatched(channel);
    localStorage.setItem('viciontv_recent', String(channel.id));
  };

  const handleShowDetail = (channel) => {
    if (!channel) return;
    setSelectedDetail(channel);
  };

  const toggleFavorite = (id) => {
    setFavorites(prev => {
      const idStr = String(id);
      const newFavs = prev.includes(idStr) ? prev.filter(f => f !== idStr) : [...prev, idStr];
      localStorage.setItem('viciontv_favorites', JSON.stringify(newFavs));
      return newFavs;
    });
  };

  const filteredChannels = useMemo(() => {
    if (!channelData?.channels) return [];
    
    // First, filter by Category and Search
    const basicFiltered = channelData.channels.filter(channel => {
      if (!channel?.name) return false;
      const matchesSearch = channel.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (activeCategory === 'Todos') return matchesSearch;
      if (activeCategory === 'Favoritos') return matchesSearch && favorites.includes(String(channel.id));
      const cleanCategory = channel.category ? String(channel.category).split(';')[0].trim() : 'General';
      return matchesSearch && cleanCategory === activeCategory;
    });

    // Now, Group by groupId (Show only one poster per collection)
    const seenGroups = new Set();
    return basicFiltered.map(channel => {
       const rawName = String(channel?.name || 'Contenido Sin Título');
       if (!channel.groupId) return { ...channel, displayName: rawName };
       if (seenGroups.has(channel.groupId)) return null;
       seenGroups.add(channel.groupId);
       
       // Clean name for grid (Remove "Cap X" or "Ep X")
       const cleanName = rawName.split(' - ')[0].split(' Cap ')[0].split(' Ep ')[0].trim();
       return { ...channel, displayName: cleanName };
    }).filter(Boolean);
  }, [searchQuery, activeCategory, favorites, channelData]);

  const dynamicCategories = useMemo(() => {
    if (!channelData?.channels) return ['Todos'];
    const catsAndCounts = {};
    channelData.channels.forEach(c => {
      const cleanCat = c.category ? String(c.category).split(';')[0].trim() : 'General';
      catsAndCounts[cleanCat] = (catsAndCounts[cleanCat] || 0) + 1;
    });
    const sortedNames = Object.keys(catsAndCounts).filter(k => catsAndCounts[k] > 0).sort();
    return ['Todos', ...sortedNames, 'Favoritos'];
  }, [channelData]);

  if (isAppLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#050507]">
        <div className="relative">
          <div className="w-24 h-24 border-b-4 border-indigo-600 rounded-full animate-spin"></div>
          <PlayCircle className="absolute inset-0 m-auto w-10 h-10 text-white fill-indigo-500/20" />
        </div>
        <div className="mt-8 text-center space-y-2">
          <h2 className="text-white font-black text-2xl tracking-tighter uppercase italic">Animux<span className="text-indigo-500">Live</span></h2>
          <p className="text-gray-500 text-xs font-bold tracking-[0.3em] animate-pulse">Sincronizando Servidores de Cuevana...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-[#060608] text-white overflow-hidden w-full relative selection:bg-indigo-500/30 font-sans">
      
      {/* Search Header fixed at top */}
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <main className="flex-1 overflow-y-auto pb-24 md:pb-12 custom-scrollbar scroll-smooth" id="scrollArea">
        
        {/* Genre/Category Navigation - Cuevana style */}
        <div className="w-full px-6 py-4 flex gap-8 overflow-x-auto no-scrollbar sticky top-0 z-40 bg-[#060608]/90 backdrop-blur-xl border-b border-white/5">
          {dynamicCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 text-xs font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'text-indigo-500 border-b-2 border-indigo-500 pb-1' : 'text-gray-500 hover:text-white'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="p-4 md:p-12 pt-0">
          {!searchQuery && activeCategory === 'Todos' ? (
            <div className="space-y-12 max-w-[1800px] mx-auto">
              <Hero featuredChannel={featuredHeroChannel} onPlay={handleShowDetail} />
              
              {/* Horizontal Content Rows (Xuper style) */}
              {dynamicCategories.filter(c => c !== 'Todos' && c !== 'Favoritos').map(cat => {
                const items = channelData.channels
                  .filter(c => {
                    const cleanCat = c.category ? c.category.split(';')[0].trim() : 'General';
                    return cleanCat === cat;
                  })
                  .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
                  .slice(0, 50); // Show up to 50 per row on home

                if (items.length === 0) return null;
                return (
                  <div key={cat} className="space-y-4">
                    <div className="flex justify-between items-center px-4">
                       <h2 className="text-sm md:text-lg font-black tracking-[0.2em] uppercase text-white/40">{cat}</h2>
                       <button onClick={() => setActiveCategory(cat)} className="text-xs text-indigo-400 font-bold hover:text-white transition-colors">EXPLORAR TODO</button>
                    </div>
                    <div className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar snap-x px-4 pb-8">
                       {items.map(channel => (
                         <div key={channel.id} className="w-[180px] sm:w-[200px] md:w-[220px] lg:w-[240px] shrink-0 snap-start">
                           <ChannelCard 
                             channel={channel}
                             isFavorite={favorites.includes(channel.id)}
                             toggleFavorite={toggleFavorite}
                             onPlay={handleShowDetail}
                           />
                         </div>
                       ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="max-w-[1800px] mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 md:gap-6 animate-fade-in">
              {filteredChannels.slice(0, 500).map(channel => (
                <ChannelCard 
                  key={channel.id}
                  channel={channel}
                  isFavorite={favorites.includes(channel.id)}
                  toggleFavorite={toggleFavorite}
                  onPlay={handleShowDetail}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modern Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-black/80 backdrop-blur-xl border-t border-white/5 z-50 flex justify-around items-center px-6 md:hidden">
        <button onClick={() => setActiveCategory('Todos')} className={`flex flex-col items-center gap-1 ${activeCategory === 'Todos' ? 'text-white' : 'text-gray-500'}`}>
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-bold">Inicio</span>
        </button>
        <button onClick={() => setActiveCategory('Cine')} className={`flex flex-col items-center gap-1 ${activeCategory === 'Cine' ? 'text-white' : 'text-gray-500'}`}>
          <Play className="w-6 h-6" />
          <span className="text-[10px] font-bold">Películas</span>
        </button>
        <button onClick={() => setActiveCategory('Series')} className={`flex flex-col items-center gap-1 ${activeCategory === 'Series' ? 'text-white' : 'text-gray-500'}`}>
          <Tv2 className="w-6 h-6" />
          <span className="text-[10px] font-bold">Series</span>
        </button>
        <button onClick={() => setActiveCategory('Favoritos')} className={`flex flex-col items-center gap-1 ${activeCategory === 'Favoritos' ? 'text-white' : 'text-gray-500'}`}>
          <Star className={`w-6 h-6 ${activeCategory === 'Favoritos' ? 'fill-white' : ''}`} />
          <span className="text-[10px] font-bold">Mi Lista</span>
        </button>
      </nav>

      {activeChannel && (() => {
        // Decide playlist: if it's a group, show ONLY that group. If not, show current filtered list.
        const playerPlaylist = activeChannel.groupId 
          ? channelData.channels.filter(c => c.groupId === activeChannel.groupId)
          : filteredChannels;

        return (
          <Player 
            channel={activeChannel} 
            onClose={() => setActiveChannel(null)} 
            playlist={playerPlaylist}
            onPlayNext={handlePlayChannel}
          />
        );
      })()}

      {selectedDetail && (
        <DetailsModal 
          channel={selectedDetail} 
          onClose={() => setSelectedDetail(null)} 
          onPlay={handlePlayChannel}
          isFavorite={favorites.includes(selectedDetail.id)}
          toggleFavorite={toggleFavorite}
        />
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .mask-fade { -webkit-mask-image: linear-gradient(to right, black 85%, transparent 100%); }
      `}} />
    </div>
  );
}

export default App;
