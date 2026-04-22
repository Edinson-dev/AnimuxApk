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
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [channelData, setChannelData] = useState({ channels: [] });
  const [visibleCount, setVisibleCount] = useState(500);
  
  window.onGoHome = () => setActiveCategory('Todos');
  
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
  }, []);

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
    const basicFiltered = channelData.channels.filter(channel => {
      if (!channel?.name) return false;
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
  }, [searchQuery, activeCategory, favorites, channelData]);

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

      <main className="flex-1 overflow-y-auto pb-32 md:pb-12" id="scrollArea">
        <div className="p-4 md:p-12 pt-8">
          {activeCategory === 'Todos' && !searchQuery ? (
            <div className="space-y-12 animate-fade-in max-w-[1800px] mx-auto">
              <Hero channel={channelData.channels.find(c => c.groupId === 'DBZ-Cloverway-Episodes' || c.groupId === 'los-simpsons-latino-temporadas-1-10')} onPlay={setSelectedDetail} />
              
              {['Series', 'Cine', 'Infantil & Anime', 'Deportes', 'Documentales'].map((cat) => {
                const items = channelData.channels
                  .filter(c => (c.category || "").toLowerCase().includes(cat.toLowerCase()))
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
                  <div key={cat} className="space-y-4">
                    <div className="flex items-center justify-between">
                       <h3 className="text-sm md:text-xl font-black text-white/90 uppercase tracking-widest flex items-center gap-2">
                          <span className="w-1 h-5 bg-indigo-500 rounded-full" /> {cat}
                       </h3>
                       <button onClick={() => setActiveCategory(cat)} className="text-[10px] font-bold text-indigo-400 hover:text-white uppercase">Explorar Todo</button>
                    </div>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x">
                       {groupedHome.map(channel => (
                         <div key={channel.id} className="w-[140px] md:w-[220px] shrink-0 snap-start transform transition-transform hover:scale-105">
                           <ChannelCard channel={channel} isFavorite={favorites.includes(String(channel.id))} toggleFavorite={toggleFavorite} onPlay={setSelectedDetail} />
                         </div>
                       ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="max-w-[1400px] mx-auto animate-fade-in">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl md:text-5xl font-black italic uppercase tracking-tighter text-white/10">{activeCategory}</h2>
                <button 
                  onClick={() => setActiveCategory('Todos')} 
                  className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border border-white/5"
                >
                  Regresar al Inicio
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-8">
                {filteredChannels.slice(0, visibleCount || 500).map(channel => (
                  <ChannelCard key={channel.id} channel={channel} isFavorite={favorites.includes(String(channel.id))} toggleFavorite={toggleFavorite} onPlay={setSelectedDetail} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] h-16 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-full z-50 flex justify-around items-center px-4 shadow-2xl">
        {[
          { id: 'Todos', icon: Home, label: 'Inicio' },
          { id: 'Cine', icon: Play, label: 'Cine' },
          { id: 'Series', icon: Grid, label: 'Series' },
          { id: 'Favoritos', icon: Heart, label: 'Favs' }
        ].map((item) => (
          <button key={item.id} onClick={() => setActiveCategory(item.id)} className={`flex flex-col items-center gap-1 ${activeCategory === item.id ? 'text-indigo-400 scale-110' : 'text-gray-500'}`}>
            <item.icon className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase">{item.label}</span>
          </button>
        ))}
      </nav>

      {activeChannel && (() => {
        const playerPlaylist = activeChannel.groupId ? channelData.channels.filter(c => c.groupId === activeChannel.groupId) : filteredChannels;
        return <Player channel={activeChannel} onClose={() => setActiveChannel(null)} playlist={playerPlaylist} onPlayNext={setActiveChannel} />;
      })()}

      {selectedDetail && <DetailsModal channel={selectedDetail} onClose={() => setSelectedDetail(null)} onPlay={setActiveChannel} isFavorite={favorites.includes(String(selectedDetail.id))} toggleFavorite={toggleFavorite} />}
    </div>
  );
}

export default App;
