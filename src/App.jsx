import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import ChannelCard from './components/ChannelCard';
import Player from './components/Player';
import Hero from './components/Hero';
import DetailsModal from './components/DetailsModal';
import Skeleton from './components/Skeleton';
import { Tv2, Heart, Compass, Grid, Play, Home, Search, Star, MessageSquare, PlayCircle, AlertCircle } from 'lucide-react';

function App() {
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [brokenChannels, setBrokenChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [error, setError] = useState(null);
  const [channelData, setChannelData] = useState({ channels: [] });
  
  window.onGoHome = () => setActiveCategory('Todos');
  window.setActiveCategory = (cat) => setActiveCategory(cat);
  
  const loadData = () => {
    setIsAppLoading(true);
    setError(null);
    fetch('/channels.json')
      .then(res => {
        if (!res.ok) throw new Error('No se pudo cargar el catálogo');
        return res.json();
      })
      .then(data => {
        if (data && data.channels) {
          setChannelData(data);
        } else {
          throw new Error('Catálogo vacío');
        }
      })
      .catch(err => {
        console.error("Error cargando canales:", err);
        setError(err.message);
      })
      .finally(() => setIsAppLoading(false));
  };

  useEffect(() => {
    loadData();

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
  const [page, setPage] = useState(1);

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

  useEffect(() => {
    setPage(1);
  }, [searchQuery, activeCategory]);

  const displayedChannels = useMemo(() => {
    return filteredChannels.slice(0, page * channelsPerPage);
  }, [filteredChannels, page]);

  const loadMore = () => {
    if (displayedChannels.length < filteredChannels.length) {
      setPage(prev => prev + 1);
    }
  };

  if (isAppLoading) {
    return (
      <div className="flex flex-col h-screen bg-[#060608]">
        <Header searchQuery="" setSearchQuery={() => {}} />
        <div className="flex-1 overflow-hidden">
          <Skeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#060608] p-6 text-center space-y-6">
        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center border border-rose-500/20">
          <AlertCircle className="w-10 h-10 text-rose-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Ops! Algo salió mal</h2>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">{error}. Verifica tu conexión o intenta de nuevo.</p>
        </div>
        <button 
          onClick={loadData}
          className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-black text-xs transition-all shadow-lg active:scale-95"
        >
          REINTENTAR CARGA
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-[#060608] text-white overflow-hidden w-full relative selection:bg-indigo-500/30">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <main className="flex-1 overflow-y-auto pb-32 md:pb-12 custom-scrollbar relative pt-20" id="scrollArea">
        <div className="p-4 md:p-12 pt-8">
          {activeCategory === 'Todos' && !searchQuery ? (
            <div className="space-y-12 md:space-y-20 animate-fade-in max-w-[1800px] mx-auto">
              <Hero 
                featuredChannel={channelData.channels.find(c => c.category?.includes('Cine') || c.category?.includes('Series'))} 
                onPlay={setActiveChannel} 
                onDetails={setSelectedDetail} 
              />
              
              {['Series', 'Filmes', 'Infantil', 'Anime', 'Deportes', 'Documentales'].map((cat) => {
                const items = channelData.channels
                  .filter(c => {
                    const chCat = (c.category || "").toLowerCase();
                    if (cat === 'Filmes') return chCat.includes('cine') || chCat.includes('movie');
                    return chCat.includes(cat.toLowerCase());
                  })
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
                  <div key={cat} className="space-y-8 mb-20">
                    <div className="flex items-end justify-between px-2">
                       <div className="space-y-1">
                          <h3 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter italic">
                             {cat}
                          </h3>
                          <div className="w-12 h-1 bg-white/20 rounded-full" />
                       </div>
                       <button onClick={() => setActiveCategory(cat)} className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-white transition-all">VER TODO</button>
                    </div>
                    <div className="flex gap-4 md:gap-5 overflow-x-auto no-scrollbar pb-10 snap-x scroll-smooth px-2">
                       {groupedHome.map(channel => (
                         <div key={channel.id} className="w-[150px] md:w-[240px] shrink-0 snap-start">
                           <ChannelCard channel={channel} onPlay={setSelectedDetail} />
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
                 <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white leading-none">{activeCategory}</h2>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-8">
                {displayedChannels.map(channel => (
                  <ChannelCard key={channel.id} channel={channel} isFavorite={favorites.includes(String(channel.id))} toggleFavorite={toggleFavorite} onPlay={setSelectedDetail} />
                ))}
              </div>

              {displayedChannels.length < filteredChannels.length && (
                <div className="flex justify-center mt-20 mb-10">
                  <button onClick={loadMore} className="px-12 py-5 bg-white/5 hover:bg-indigo-600 text-white rounded-full font-black uppercase tracking-widest text-[10px] transition-all border border-white/10">
                    Cargar más
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] h-20 bg-[#0d0d0f]/80 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] z-50 flex justify-around items-center px-4 shadow-2xl">
        {[
          { id: 'Todos', icon: Home, label: 'Inicio' },
          { id: 'Filmes', icon: Tv2, label: 'Canales' },
          { id: 'Favoritos', icon: Star, label: 'Favoritos' }
        ].map((item) => (
          <button 
            key={item.id} 
            onClick={() => setActiveCategory(item.id)} 
            className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-300 w-16 h-16 rounded-3xl ${activeCategory === item.id ? 'text-indigo-500' : 'text-gray-500'}`}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[9px] font-bold uppercase tracking-tighter">{item.label}</span>
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
