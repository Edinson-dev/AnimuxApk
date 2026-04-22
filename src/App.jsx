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
  const channelsPerPage = 48;

  const loadData = async () => {
    try {
      setIsAppLoading(true);
      setError(null);
      const response = await fetch('/channels.json');
      if (!response.ok) throw new Error('Error de conexión');
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
       displayName: (channel.name || "").split(' - ')[0].split(' Cap ')[0].trim()
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

  return (
    <div className="flex flex-col h-[100dvh] bg-[#000000] text-white overflow-hidden w-full relative">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <main className="flex-1 overflow-y-auto pb-32 md:pb-12 custom-scrollbar relative pt-20 px-4 md:px-8" id="scrollArea">
        <div className="max-w-[1920px] mx-auto py-6">
          {activeCategory === 'Todos' && !searchQuery ? (
            <div className="space-y-10 md:space-y-16 animate-fade-in">
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
                  .slice(0, 18);
                
                if (items.length === 0) return null;

                return (
                  <div key={cat} className="space-y-4">
                    <div className="flex items-center justify-between">
                       <h3 className="text-xl md:text-2xl font-normal text-white uppercase tracking-widest">{cat}</h3>
                       <button onClick={() => setActiveCategory(cat)} className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-white">Ver Todo</button>
                    </div>
                    <div className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar pb-6">
                       {items.map(channel => (
                         <div key={channel.id} className="w-[110px] md:w-[160px] shrink-0">
                           <ChannelCard channel={{...channel, displayName: channel.name.split(' - ')[0]}} onPlay={setActiveChannel} />
                         </div>
                       ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="animate-fade-in space-y-10">
              <div className="flex items-end justify-between border-b border-white/5 pb-4">
                 <h2 className="text-2xl md:text-4xl font-normal text-white uppercase tracking-widest">
                    {searchQuery ? `Resultados: ${searchQuery}` : activeCategory}
                 </h2>
                 <span className="text-[9px] font-bold text-gray-600 tracking-widest uppercase">{filteredChannels.length} Canales</span>
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
                <div className="flex justify-center mt-12 mb-12">
                  <button onClick={loadMore} className="px-10 py-3 bg-white/5 border border-white/10 hover:border-white/30 text-white rounded-full font-bold text-[9px] tracking-widest uppercase transition-all">Ver más</button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-[70] bg-black/80 backdrop-blur-3xl border-t border-white/[0.03] py-4 flex justify-around items-center md:hidden">
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
