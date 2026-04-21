import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChannelCard from './components/ChannelCard';
import Player from './components/Player';
import Hero from './components/Hero';
import Carousel from './components/Carousel';
import { Tv2, Sparkles, Heart, Compass, Zap } from 'lucide-react';

function App() {
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [recentlyWatched, setRecentlyWatched] = useState(null);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [channelData, setChannelData] = useState({ channels: [] });
  
  // Pick a featured channel for the Hero section. We can pick a popular one or random.
  // Using memo to keep it consistent per render.
  const featuredHeroChannel = useMemo(() => {
    if (!channelData.channels.length) return null;
    const defaultFeatured = channelData.channels.find(c => c.category === '24/7' || c.category === 'Anime') || channelData.channels[0];
    return defaultFeatured;
  }, [channelData]);

  useEffect(() => {
    // 1. Fetch channel data asynchronously
    fetch('/channels.json')
      .then(res => res.json())
      .then(data => {
        setChannelData(data);
        
        // Handle Direct Play via URL Parameter
        const urlParams = new URLSearchParams(window.location.search);
        const playId = urlParams.get('play');
        if (playId) {
           const channel = data.channels.find(c => c.id === parseInt(playId));
           if (channel) {
             setActiveChannel(channel);
             setRecentlyWatched(channel);
             localStorage.setItem('viciontv_recent', channel.id.toString());
             // Limpiar la URL para evitar que al refrescar por el sistema automático siga
             window.history.replaceState({}, document.title, "/");
           }
        } else {
          // 2. Load recent channel after data is ready if no direct play link provided
          const savedRecent = localStorage.getItem('viciontv_recent');
          if (savedRecent) {
            const channel = data.channels.find(c => c.id === parseInt(savedRecent));
            if (channel) setRecentlyWatched(channel);
          }
        }
      })
      .catch(err => console.error("Error loading channels:", err))
      .finally(() => {
        setIsAppLoading(false); // Stop loading when fetch completes
      });

    const savedFavorites = localStorage.getItem('viciontv_favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  const handlePlayChannel = (channel) => {
    setActiveChannel(channel);
    setRecentlyWatched(channel);
    localStorage.setItem('viciontv_recent', channel.id.toString());
  };

  const toggleFavorite = (id) => {
    setFavorites(prev => {
      const newFavs = prev.includes(id) 
        ? prev.filter(f => f !== id)
        : [...prev, id];
      
      localStorage.setItem('viciontv_favorites', JSON.stringify(newFavs));
      return newFavs;
    });
  };

  const filteredChannels = useMemo(() => {
    return channelData.channels.filter(channel => {
      const matchesSearch = channel.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (activeCategory === 'Todos') return matchesSearch;
      if (activeCategory === 'Favoritos') return matchesSearch && favorites.includes(channel.id);
      
      const cleanCategory = channel.category ? channel.category.split(';')[0].trim() : 'General';
      return matchesSearch && cleanCategory === activeCategory;
    });
  }, [searchQuery, activeCategory, favorites, channelData]);

  const dynamicCategories = useMemo(() => {
    const catsAndCounts = {};
    channelData.channels.forEach(c => {
      const cleanCat = c.category ? c.category.split(';')[0].trim() : 'General';
      catsAndCounts[cleanCat] = (catsAndCounts[cleanCat] || 0) + 1;
    });
    
    const sortedNames = Object.keys(catsAndCounts).sort();
    return [
      { name: 'Todos', count: channelData.channels.length },
      ...sortedNames.map(name => ({name, count: catsAndCounts[name]})),
      { name: 'Favoritos', count: favorites.length }
    ];
  }, [channelData, favorites]);

  return (
    <div className="flex h-[100dvh] bg-[#050508] text-white overflow-hidden w-full relative selection:bg-primary/30">
      
      {/* Intense Background Glow Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-600/20 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <main className="flex-1 flex flex-col relative z-10 w-full h-full overflow-hidden custom-scrollbar bg-transparent">
        <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        
        {/* Modern Mobile Horizontal Top-Pill Navigation (Replaces Sidebar) */}
        <div className="w-full px-4 md:px-8 py-4 overflow-x-auto custom-scrollbar sticky top-0 z-40 bg-[#050508]/80 backdrop-blur-2xl border-b border-white/5 flex gap-3 items-center snap-x">
          {dynamicCategories.map((cat) => {
            const catName = typeof cat === 'string' ? cat : cat.name;
            const isActive = activeCategory === catName;
            return (
              <button
                key={catName}
                onClick={() => setActiveCategory(catName)}
                className={`snap-center shrink-0 flex items-center gap-2 px-6 py-2.5 rounded-full font-bold transition-all duration-300 border ${isActive ? 'bg-indigo-600 text-white border-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.5)]' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'}`}
              >
                {catName === 'Todos' && <Compass className="w-4 h-4" />}
                {catName === 'Favoritos' && <Heart className={`w-4 h-4 ${isActive ? 'fill-white' : ''}`} />}
                {catName !== 'Todos' && catName !== 'Favoritos' && <Zap className="w-4 h-4" />}
                {catName}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-6 relative" id="scrollArea">
          
          <div className="mb-8 hidden">
            {/* Ocultamos el título viejo aburrido para dejarle protagonismo al Hero */}
          </div>

          {isAppLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden animate-pulse aspect-video flex flex-col">
                  <div className="w-full h-full bg-white/10"></div>
                </div>
              ))}
            </div>
          ) : activeCategory === 'Todos' && !searchQuery ? (
            <>
              {/* Hero Section */}
              <Hero featuredChannel={featuredHeroChannel} onPlay={handlePlayChannel} />
              
              {/* Continue Watching Section */}
              {recentlyWatched && (
                <div className="mb-10">
                   <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                     <span className="w-1.5 h-6 bg-primary rounded-full inline-block"></span>
                     Seguir Viendo
                   </h2>
                   <div className="w-[300px]">
                     <ChannelCard 
                       channel={recentlyWatched}
                       isFavorite={favorites.includes(recentlyWatched.id)}
                       toggleFavorite={toggleFavorite}
                       onPlay={handlePlayChannel}
                     />
                   </div>
                </div>
              )}

              {/* Carousels for each category */}
              {dynamicCategories.filter(cat => cat.name !== 'Todos' && cat.name !== 'Favoritos').map(category => {
                const categoryChannels = channelData.channels.filter(c => c.category === category.name);
                if (categoryChannels.length === 0) return null;
                
                return (
                  <Carousel key={category.name} title={category.name}>
                    {categoryChannels.map(channel => (
                      <ChannelCard 
                        key={channel.id}
                        channel={channel}
                        isFavorite={favorites.includes(channel.id)}
                        toggleFavorite={toggleFavorite}
                        onPlay={handlePlayChannel}
                      />
                    ))}
                  </Carousel>
                );
              })}
            </>
          ) : (
            <>
              {filteredChannels.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredChannels.map(channel => (
                    <ChannelCard 
                      key={channel.id}
                      channel={channel}
                      isFavorite={favorites.includes(channel.id)}
                      toggleFavorite={toggleFavorite}
                      onPlay={handlePlayChannel}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-20 text-center glass rounded-3xl mt-10">
                  <Tv2 className="w-20 h-20 text-gray-600 mb-6" />
                  <h3 className="text-2xl font-bold text-gray-300 mb-2">No encontramos resultados</h3>
                  <p className="text-gray-500 max-w-md">
                    No hay canales disponibles para tu búsqueda o en esta categoría. Intenta buscar otra cosa.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Video Player Modal */}
      {activeChannel && (
        <Player 
          channel={activeChannel} 
          onClose={() => setActiveChannel(null)} 
        />
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #2d313a;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #4f46e5;
          }
        `
      }} />
    </div>
  );
}

export default App;
