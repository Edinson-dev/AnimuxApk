import React, { useState, useEffect, useMemo } from 'react';
import { Home, Tv, Film, Heart, AlertCircle } from 'lucide-react';
import Header from './components/Header';
import Hero from './components/Hero';
import ChannelCard from './components/ChannelCard';
import Player from './components/Player';
import DetailsModal from './components/DetailsModal';
import Skeleton from './components/Skeleton';

export default function App() {
  const [channelData, setChannelData] = useState({ channels: [] });
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('animux_favs') || '[]'));
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChannel, setActiveChannel] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [brokenChannels, setBrokenChannels] = useState(() => JSON.parse(localStorage.getItem('animux_broken') || '[]'));
  const channelsPerPage = 48; // More channels per page for smaller cards

  const loadData = async () => {
    try {
      setIsAppLoading(true);
      setError(null);
      const response = await fetch('/channels.json');
      if (!response.ok) throw new Error('Catálogo no encontrado');
      const data = await response.json();
      setChannelData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setTimeout(() => setIsAppLoading(false), 800);
    }
  };

  useEffect(() => {
    loadData();
    window.onGoHome = () => { setActiveCategory('Todos'); setSearchQuery(''); };
    window.setActiveCategory = (cat) => setActiveCategory(cat);
  }, []);

  const toggleFavorite = (id) => {
    const newFavs = favorites.includes(String(id))
      ? favorites.filter(fid => fid !== String(id))
      : [...favorites, String(id)];
    setFavorites(newFavs);
    localStorage.setItem('animux_favs', JSON.stringify(newFavs));
  };

  const handleReportBroken = (id) => {
    const newBroken = [...new Set([...brokenChannels, String(id)])];
    setBrokenChannels(newBroken);
    localStorage.setItem('animux_broken', JSON.stringify(newBroken));
  };

  const filteredChannels = useMemo(() => {
    let result = channelData.channels.filter(c => !brokenChannels.includes(String(c.id)));
    
    if (activeCategory === 'Favoritos') {
      result = result.filter(c => favorites.includes(String(c.id)));
    } else if (activeCategory !== 'Todos') {
      const catLower = activeCategory.toLowerCase();
      result = result.filter(c => {
        const chCat = (c.category || "").toLowerCase();
        if (activeCategory === 'Filmes') return chCat.includes('cine') || chCat.includes('movie');
        return chCat.includes(catLower);
      });
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => 
        (c.name || "").toLowerCase().includes(q) || 
        (c.category || "").toLowerCase().includes(q)
      );
    }

    return result.map(channel => ({
       ...channel,
       displayName: channel.name.split(' - ')[0].split(' Cap ')[0].trim()
    })).filter(Boolean);
  }, [searchQuery, activeCategory, favorites, channelData, brokenChannels]);

  useEffect(() => {
    setPage(1);
    const area = document.getElementById('scrollArea');
    if (area) area.scrollTo(0, 0);
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
      <div className="flex flex-col h-screen bg-[#000000]">
        <Header searchQuery="" setSearchQuery={() => {}} />
        <div className="flex-1 overflow-hidden pt-24"><Skeleton /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black p-6 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-lg font-bold text-white uppercase tracking-widest mb-6">Error de conexión</h2>
        <button onClick={loadData} className="px-10 py-3 bg-white text-black rounded-full font-bold text-[10px] uppercase">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-[#000000] text-white overflow-hidden w-full relative">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <main className="flex-1 overflow-y-auto pb-32 md:pb-12 custom-scrollbar relative pt-20" id="scrollArea">
        <div className="p-4 md:p-12 pt-8 max-w-[1920px] mx-auto">
          {activeCategory === 'Todos' && !searchQuery ? (
            <div className="space-y-16 md:space-y-24 animate-fade-in">
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
                  .slice(0, 20);
                
                if (items.length === 0) return null;

                return (
                  <div key={cat} className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                       <h3 className="text-lg md:text-xl font-bold text-white uppercase tracking-[0.2em]">{cat}</h3>
                       <button onClick={() => setActiveCategory(cat)} className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-500 hover:text-white transition-all">Ver Todo</button>
                    </div>
                    <div className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar pb-8 px-2">
                       {items.map(channel => (
                         <div key={channel.id} className="w-[120px] md:w-[180px] shrink-0">
                           <ChannelCard channel={{...channel, displayName: channel.name.split(' - ')[0]}} onPlay={setActiveChannel} />
                         </div>
                       ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12 px-2">
                 <h2 className="text-2xl md:text-4xl font-bold text-white uppercase tracking-[0.1em]">
                    {searchQuery ? `Resultados: ${searchQuery}` : activeCategory}
                 </h2>
                 <span className="text-[9px] font-bold text-gray-600 tracking-[0.3em] uppercase">{filteredChannels.length} Canales</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 md:gap-6">
                {displayedChannels.map(channel => (
                  <ChannelCard 
                    key={channel.id} 
                    channel={channel} 
                    onPlay={setActiveChannel} 
                  />
                ))}
              </div>
              
              {displayedChannels.length < filteredChannels.length && (
                <div className="flex justify-center mt-20 mb-12">
                  <button onClick={loadMore} className="px-12 py-4 bg-white/5 border border-white/10 hover:border-white/30 text-white rounded-full font-bold text-[10px] tracking-[0.3em] uppercase transition-all">Ver más contenido</button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-[70] bg-black/60 backdrop-blur-3xl border-t border-white/[0.03] py-4 flex justify-around items-center md:hidden">
         <button onClick={() => { setActiveCategory('Todos'); setSearchQuery(''); }} className={`p-2 ${activeCategory === 'Todos' ? 'text-white' : 'text-gray-500'}`}><Home className="w-6 h-6" /></button>
         <button onClick={() => setActiveCategory('Series')} className={`p-2 ${activeCategory === 'Series' ? 'text-white' : 'text-gray-500'}`}><Tv className="w-6 h-6" /></button>
         <button onClick={() => setActiveCategory('Filmes')} className={`p-2 ${activeCategory === 'Filmes' ? 'text-white' : 'text-gray-500'}`}><Film className="w-6 h-6" /></button>
         <button onClick={() => setActiveCategory('Favoritos')} className={`p-2 ${activeCategory === 'Favoritos' ? 'text-white' : 'text-gray-500'}`}><Heart className="w-6 h-6" /></button>
      </nav>

      {activeChannel && (
        <Player 
          channel={activeChannel} 
          onClose={() => setActiveChannel(null)} 
          playlist={filteredChannels}
          onPlayNext={setActiveChannel}
          onReportBroken={handleReportBroken}
        />
      )}

      {selectedDetail && (
        <DetailsModal 
          channel={selectedDetail} 
          onClose={() => setSelectedDetail(null)} 
          onPlay={(ch) => { setActiveChannel(ch); setSelectedDetail(null); }}
          isFavorite={favorites.includes(String(selectedDetail.id))}
          toggleFavorite={toggleFavorite}
          allChannels={channelData.channels}
          onSelect={setSelectedDetail}
        />
      )}
    </div>
  );
}
