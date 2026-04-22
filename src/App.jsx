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
  const [brokenChannels, setBrokenChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [channelData, setChannelData] = useState({ channels: [] });
  const [visibleCount, setVisibleCount] = useState(500);
  
  window.onGoHome = () => setActiveCategory('Todos');
  window.setActiveCategory = (cat) => setActiveCategory(cat);
  
  useEffect(() => {
    fetch('/channels.json')
      .then(res => res.json())
      .then(data => {
        if (data && data.channels) setChannelData(data);
      })
      .catch(err => console.error("Error cargando canales:", err))
      .finally(() => setIsAppLoading(false));

    const savedFavorites = localStorage.getItem('viciontv_favorites');
    if (savedFavorites) {
      try { setFavorites(JSON.parse(savedFavorites)); } catch(e) { setFavorites([]); }
    }
    
    const savedBroken = localStorage.getItem('viciontv_broken');
    if (savedBroken) {
      try { setBrokenChannels(JSON.parse(savedBroken)); } catch(e) { setBrokenChannels([]); }
    }
  }, []);

  const toggleFavorite = (id) => {
    setFavorites(prev => {
      const idStr = String(id);
      const newFavs = prev.includes(idStr) ? prev.filter(f => f !== idStr) : [...prev, idStr];
      localStorage.setItem('viciontv_favorites', JSON.stringify(newFavs));
      return newFavs;
    });
  };

  const toggleBroken = (id) => {
    setBrokenChannels(prev => {
      const idStr = String(id);
      const newBroken = prev.includes(idStr) ? prev.filter(f => f !== idStr) : [...prev, idStr];
      localStorage.setItem('viciontv_broken', JSON.stringify(newBroken));
      return newBroken;
    });
  };

  const channelsPerPage = 40;
  const [displayedChannels, setDisplayedChannels] = useState([]);
  const [page, setPage] = useState(1);

  // Filter broken and handle search/category
  const filteredChannels = useMemo(() => {
    if (!channelData?.channels) return [];
    const basicFiltered = channelData.channels.filter(channel => {
      if (!channel?.name) return false;
      if (brokenChannels.includes(String(channel.id))) return false;
      const matchesSearch = (channel.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (channel.displayName || "").toLowerCase().includes(searchQuery.toLowerCase());
      if (activeCategory === 'Todos') return matchesSearch;
      if (activeCategory === 'Favoritos') return matchesSearch && favorites.includes(String(channel.id));
      const cleanCategory = channel.category ? String(channel.category).split(';')[0].trim() : 'General';
      return matchesSearch && cleanCategory.toLowerCase() === activeCategory.toLowerCase();
    });

    const seenGroups = new Set();
    return basicFiltered.map(channel => {
       const rawName = String(channel?.name || 'Contenido Sin Título');
       if (!channel.groupId) return { ...channel, displayName: rawName };
       if (seenGroups.has(channel.groupId)) return null;
       seenGroups.add(channel.groupId);
       const cleanName = rawName.split(' - ')[0].split(' Cap ')[0].split(' Ep ')[0].trim();
       return { ...channel, displayName: cleanName };
    }).filter(Boolean);
  }, [searchQuery, activeCategory, favorites, channelData, brokenChannels]);

  // Reset page when filtering changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, activeCategory]);

  // Update displayed slice
  useEffect(() => {
    setDisplayedChannels(filteredChannels.slice(0, page * channelsPerPage));
  }, [filteredChannels, page]);

  const loadMore = () => {
    if (displayedChannels.length < filteredChannels.length) {
      setPage(prev => prev + 1);
    }
  };

  if (isAppLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#050507]">
        <div className="relative">
          <div className="w-24 h-24 border-b-4 border-indigo-600 rounded-full animate-spin"></div>
          <PlayCircle className="absolute inset-0 m-auto w-10 h-10 text-white fill-indigo-500/20" />
        </div>
        <div className="mt-8 text-center space-y-2">
          <h2 className="text-white font-black text-2xl tracking-tighter uppercase italic">Animux<span className="text-indigo-500">Live</span></h2>
          <p className="text-gray-500 text-xs font-bold tracking-[0.3em] animate-pulse">Sincronizando Servidores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-[#060608] text-white overflow-hidden w-full relative selection:bg-indigo-500/30">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <main className="flex-1 overflow-y-auto pb-32 md:pb-12 custom-scrollbar relative" id="scrollArea">
        <div className="p-4 md:p-12 pt-8">
          {activeCategory === 'Todos' && !searchQuery ? (
            <div className="space-y-12 md:space-y-16 animate-fade-in max-w-[1800px] mx-auto">
              <Hero featuredChannel={channelData.channels.find(c => c.groupId === 'DBZ-Cloverway-Episodes' || c.groupId === 'los-simpsons-latino-temporadas-1-10')} onPlay={setActiveChannel} onDetails={setSelectedDetail} />
              
              {['Series', 'Cine', 'Infantil & Anime', 'Deportes', 'Documentales'].map((cat) => {
                const items = channelData.channels
                  .filter(c => (c.category || "").toLowerCase().includes(cat.toLowerCase()) && !brokenChannels.includes(String(c.id)))
                  .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
                  .slice(0, 30);
                
                if (items.length === 0) return null;
                const seenHome = new Set();
                const groupedHome = items.map(channel => {
                    if (!channel.groupId) return { ...channel, displayName: channel.name };
                    if (seenHome.has(channel.groupId)) return null;
                    seenHome.add(channel.groupId);
                    return { ...channel, displayName: channel.name.split(' - ')[0].trim() };
                }).filter(Boolean);

                return (
                  <div key={cat} className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                       <div className="flex flex-col">
                          <h3 className="text-xl md:text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                             <span className="w-1.5 h-8 bg-gradient-to-b from-indigo-500 to-indigo-700 rounded-full" /> {cat}
                          </h3>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] ml-5">Contenido seleccionado</p>
                       </div>
                       <button onClick={() => setActiveCategory(cat)} className="px-5 py-2 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all">Explorar Todo</button>
                    </div>
                    <div className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar pb-8 snap-x scroll-smooth px-2">
                       {groupedHome.map(channel => (
                         <div key={channel.id} className="w-[140px] md:w-[260px] shrink-0 snap-start">
                           <ChannelCard channel={channel} isFavorite={favorites.includes(String(channel.id))} toggleFavorite={toggleFavorite} onPlay={setSelectedDetail} toggleBroken={toggleBroken} />
                         </div>
                       ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="max-w-[1500px] mx-auto animate-fade-in">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 px-4">
                <div className="space-y-2">
                   <h2 className="text-4xl md:text-7xl font-black italic uppercase tracking-tighter text-white/5 leading-none">{activeCategory}</h2>
                   <p className="text-indigo-500/60 font-black text-xs tracking-[0.4em] uppercase ml-1">Mostrando {displayedChannels.length} de {filteredChannels.length} resultados</p>
                </div>
                <button 
                  onClick={() => setActiveCategory('Todos')} 
                  className="px-8 py-3 bg-white/5 hover:bg-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 hover:border-indigo-500 shadow-xl"
                >
                  Regresar al Inicio
                </button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-10">
                {displayedChannels.map(channel => (
                  <ChannelCard key={channel.id} channel={channel} isFavorite={favorites.includes(String(channel.id))} toggleFavorite={toggleFavorite} onPlay={setSelectedDetail} toggleBroken={toggleBroken} />
                ))}
              </div>

              {displayedChannels.length < filteredChannels.length && (
                <div className="flex justify-center mt-20 mb-10">
                  <button 
                    onClick={loadMore}
                    className="px-12 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs transition-all shadow-[0_0_40px_rgba(79,70,229,0.3)] hover:scale-105 active:scale-95"
                  >
                    Cargar más contenido
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[94%] h-20 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] z-50 flex justify-around items-center px-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        {[
          { id: 'Todos', icon: Home, label: 'Inicio' },
          { id: 'Cine', icon: Tv2, label: 'Canales' },
          { id: 'Favoritos', icon: Star, label: 'Favoritos' }
        ].map((item) => (
          <button 
            key={item.id} 
            onClick={() => setActiveCategory(item.id)} 
            className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-300 w-16 h-16 rounded-3xl ${activeCategory === item.id ? 'text-indigo-400 bg-indigo-500/10' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <item.icon className={`w-5 h-5 ${activeCategory === item.id ? 'animate-bounce-short' : ''}`} />
            <span className="text-[8px] font-black uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>

      {activeChannel && (() => {
        const playerPlaylist = activeChannel.groupId ? channelData.channels.filter(c => c.groupId === activeChannel.groupId && !brokenChannels.includes(String(c.id))) : filteredChannels;
        return <Player channel={activeChannel} onClose={() => setActiveChannel(null)} playlist={playerPlaylist} onPlayNext={setActiveChannel} onReportBroken={toggleBroken} />;
      })()}

      {selectedDetail && (
        <DetailsModal 
          channel={selectedDetail} 
          onClose={() => setSelectedDetail(null)} 
          onPlay={setActiveChannel} 
          isFavorite={favorites.includes(String(selectedDetail.id))} 
          toggleFavorite={toggleFavorite} 
          onReportBroken={toggleBroken}
          allChannels={channelData.channels}
          onSelect={setSelectedDetail}
        />
      )}
    </div>
  );
}

export default App;
